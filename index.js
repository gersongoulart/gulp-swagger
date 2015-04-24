var fs = require('fs');
var through = require('through2');
var gutil = require('gulp-util');
var parser = require('swagger-parser');
var CodeGen = require('swagger-js-codegen').CodeGen;
var PLUGIN_NAME = 'gulp-swagger';

module.exports = function gulpSwagger (filename, options) {
  // Allow for passing the `filename` as part of the options.
  if ( 'object' === typeof filename ) {
    options = filename;
    filename = options.filename;
  }

  // File name is mandatory (otherwise gulp won't be able to write the file properly)
  if (!filename) {
    throw new gutil.PluginError(PLUGIN_NAME, 'A file name is required');
  }

  options = options || {};

  // Flag if user actually wants to use codeGen or just parse the schema and get json back.
  var useCodeGen = 'object' === typeof options.codegen;
  var codeGenSettings;

  // If user wants to use the codeGen
  if (useCodeGen) {
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
      }
    }

    // Regular codeGen template object, but allowing for missing templates.
    // (e.g. use case: if `request` is too simple, there's no need for a dedicated template file)
    else if ( 'object' === typeof codeGenSettings.template ) {
      function loadTemplateFile (tmpl) {
        var template = codeGenSettings.template[tmpl];

        if ( 'string' !== typeof template || !template.length ) {
          return codeGenSettings.template[tmpl] = '';
        }

        template = fs.readFileSync(template, 'utf-8');

        if ( 'string' !== typeof template || !template.length ) {
          throw new gutil.PluginError(PLUGIN_NAME, 'Could not load ' + tmpl + ' template file. Please make sure path to file is correct.');
        }

        codeGenSettings.template[tmpl] = template;
      }

      ['class', 'method', 'request'].forEach(loadTemplateFile);
    }
  }

  return through.obj(function throughObj (file, enc, cb) {
    var _this = this;

    if (file.isStream()) {
      throw new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported');
    }

    parser.parse(file.history[0], function parseSpec (error, swaggerSpec) {
      if (error) {
        cb(new gutil.PluginError(PLUGIN_NAME, error));
        return;
      }

      var fileBuffer;

      if (useCodeGen) {
        var codeGenFunction = 'get' +
          codeGenSettings.type[0].toUpperCase() +
          codeGenSettings.type.slice(1, codeGenSettings.type.length) +
          'Code';

        codeGenSettings.esnext = true;
        codeGenSettings.swagger = swaggerSpec;
        delete codeGenSettings.type;
        fileBuffer = CodeGen[codeGenFunction](codeGenSettings);
      }
      else {
        fileBuffer = JSON.stringify(swaggerSpec);
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
};
