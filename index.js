var fs = require('fs');
var path = require('path');
var through = require('through2');
var gutil = require('gulp-util');
var parser = require('swagger-parser');
var spec = require('swagger-tools').specs.v2; // Validate using the latest Swagger 2.x specification
var CodeGen = require('swagger-js-codegen').CodeGen;
var PLUGIN_NAME = 'gulp-swagger';

module.exports = function gulpSwagger (filename, options) {
  // Allow for passing the `filename` as part of the options.
  if ( 'object' === typeof filename ) {
    options = filename;
    filename = options.filename;
  }

  // File name is mandatory (otherwise gulp won't be able to write the file properly)
  if ( !filename ) {
    throw new gutil.PluginError(PLUGIN_NAME, 'A file name is required');
  }

  options = options || {};

  // Flag if user actually wants to use codeGen or just parse the schema and get json back.
  var useCodeGen = 'object' === typeof options.codegen;
  var codeGenSettings;

  // If user wants to use the codeGen
  if ( useCodeGen ) {
    // Allow for shortcuts by providing sensitive defaults.
    codeGenSettings = options.codegen || {};
    codeGenSettings.type = codeGenSettings.type || 'custom'; // type of codeGen, either: 'angular', 'node' or 'custom'.
    codeGenSettings.moduleName = codeGenSettings.moduleName || 'API';
    codeGenSettings.className = codeGenSettings.className || 'API';

    // If codeGen is of type custom, user must provide templates.
    if ( codeGenSettings.type === 'custom' && !codeGenSettings.template ) {
      throw new gutil.PluginError(PLUGIN_NAME, 'Templates are mandatory for a custom codegen');
    }

    // Shortcut: Allow `template` to be a string passing a single template file.
    else if ( 'string' === typeof codeGenSettings.template ) {
      var template = fs.readFileSync(codeGenSettings.template, 'utf-8');

      if ( 'string' !== typeof template || !template.length ) {
        throw new gutil.PluginError(PLUGIN_NAME, 'Could not load template file');
      }

      codeGenSettings.template = {
        class: template,
        method: '',
        request: ''
      };
    }

    // Regular codeGen template object, but allowing for missing templates.
    // (e.g. use case: if `request` is too simple, there's no need for a dedicated template file)
    else if ( 'object' === typeof codeGenSettings.template ) {
      ['class', 'method', 'request']
        .forEach(function loadTemplateFile (tmpl) {
          var template = codeGenSettings.template[tmpl];

          if ( 'string' !== typeof template || !template.length ) {
            return (codeGenSettings.template[tmpl] = '');
          }

          template = fs.readFileSync(template, 'utf-8');

          if ( 'string' !== typeof template || !template.length ) {
            throw new gutil.PluginError(PLUGIN_NAME, 'Could not load ' + tmpl + ' template file. Please make sure path to file is correct.');
          }

          codeGenSettings.template[tmpl] = template;
        });
    }
  }

  return through.obj(function throughObj (file, enc, cb) {
    var _this = this;

    if ( file.isStream() ) {
      throw new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported');
    }

    // Load and parse swagger schema main file.
    parser.parse(file.history[0], {
      dereference$Refs: false,
      validateSchema: false,
      strictValidation: false
    }, function parseSchema (error, swaggerObject) {
      if ( error ) {
        cb(new gutil.PluginError(PLUGIN_NAME, error));
        return;
      }

      // Validate resulting schema
      spec.validate(swaggerObject, function validateSchema (err, result) {
        if (err) {
          cb(new gutil.PluginError(PLUGIN_NAME, err));
          return;
        }

        if ( typeof result !== 'undefined' ) {
          if ( result.errors.length > 0 ) {
            gutil.log(
              gutil.colors.red([
                '',
                '',
                'Swagger Schema Errors (' + result.errors.length + ')',
                '--------------------------',
                result.errors.map(function (err) {
                  return '#/' + err.path.join('/') + ': ' + err.message +
                    '\n' +
                    JSON.stringify(err) +
                    '\n';
                }).join('\n'),
                ''
              ].join('\n')),
              ''
            );
          }

          if ( result.warnings.length > 0 ) {
            gutil.log(
              gutil.colors.yellow([
                '',
                '',
                'Swagger Schema Warnings (' + result.warnings.length + ')',
                '------------------------',
                result.warnings.map(function (warn) {
                  return '#/' + warn.path.join('/') + ': ' + warn.message +
                    '\n' +
                    JSON.stringify(warn) +
                    '\n';
                }).join('\n'),
                ''
              ].join('\n')),
              ''
            );
          }

          if ( result.errors.length > 0 ) {
            cb(new gutil.PluginError(PLUGIN_NAME, 'The Swagger schema is invalid'));
            return;
          }
        }

        // Swagger document is valid
        var fileBuffer;

        if ( useCodeGen ) {
          var codeGenFunction = 'get' +
            codeGenSettings.type[0].toUpperCase() +
            codeGenSettings.type.slice(1, codeGenSettings.type.length) +
            'Code';

          codeGenSettings.esnext = true;
          codeGenSettings.swagger = swaggerObject;
          delete codeGenSettings.type;

          codeGenSettings.mustache = codeGenSettings.mustache || {};
          // Allow swagger schema to be easily accessed inside templates.
          codeGenSettings.mustache.swagger = JSON.stringify(swaggerObject);
          // Allow each individual JSON schema to be easily accessed inside templates (for validation purposes).
          codeGenSettings.mustache.JSONSchemas = JSON.stringify(
            Object.keys(swaggerObject.paths)
              .reduce(function reducePaths (newPathCollection, currentPath) {
                var pathMethods = swaggerObject.paths[currentPath] || {};
                var pathSchemas = Object.keys(pathMethods)
                  .reduce(function reduceMethods (newMethodCollection, currentMethod) {
                    var methodParameters = (pathMethods[currentMethod].parameters || [])
                      .filter(function filterBodyParameter (parameter) {
                        return parameter.in === 'body';
                      })[0] || {};
                    var methodResponses = pathMethods[currentMethod].responses || {};
                    var methodSchemas = {
                      request: methodParameters.schema,
                      responses: Object.keys(methodResponses)
                        .reduce(function reduceMethods (newResponsesCollection, currentResponse) {
                          var responseSchema = methodResponses[currentResponse].schema || {};

                          newResponsesCollection[currentResponse] = responseSchema;
                          return newResponsesCollection;
                        }, {})
                    };

                    newMethodCollection[currentMethod] = methodSchemas;
                    return newMethodCollection;
                  }, {});

                newPathCollection[currentPath] = pathSchemas;
                return newPathCollection;
              }, {})
          );

          fileBuffer = CodeGen[codeGenFunction](codeGenSettings);
        }
        else {
          fileBuffer = JSON.stringify(swaggerObject);
        }

        // Return processed file to gulp
        _this.push(new gutil.File({
          cwd: file.cwd,
          base: file.base,
          path: path.join(file.base, filename),
          contents: new Buffer(fileBuffer)
        }));

        cb();

      });
    });

  });
};
