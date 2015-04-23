var fs = require('fs');
var through = require('through2');
var gutil = require('gulp-util');
var parser = require('swagger-parser');
var CodeGen = require('swagger-js-codegen').CodeGen;
var PLUGIN_NAME = 'gulp-swagger';

module.exports = function gulpSwagger (filename, options) {
  if ( 'object' === typeof filename ) {
    options = filename;
    filename = options.filename;
  }

  if (!filename) {
    throw new gutil.PluginError(PLUGIN_NAME, 'A file name is required');
  }

  options = options || {};

  var useCodeGen = 'object' === typeof options.codegen;
  var codeGenSettings;

  if (useCodeGen) {
    codeGenSettings = options.codegen || {};
    codeGenSettings.type = codeGenSettings.type || 'custom'; // type of codeGen, either: 'angular', 'node' or 'custom'
    codeGenSettings.moduleName = codeGenSettings.moduleName || 'API';
    codeGenSettings.className = codeGenSettings.className || 'API';

    if ( 'object' === typeof codeGenSettings.template ) {
      var classTmpl = fs.readFileSync(codeGenSettings.template.class, 'utf-8');
      var methodTmpl = fs.readFileSync(codeGenSettings.template.method, 'utf-8');
      var requestTmpl = fs.readFileSync(codeGenSettings.template.request, 'utf-8');

      if (!classTmpl || !methodTmpl || !requestTmpl) {
        throw new gutil.PluginError(PLUGIN_NAME, 'Could not load all template files');
      }

      codeGenSettings.template.class = classTmpl;
      codeGenSettings.template.method = methodTmpl;
      codeGenSettings.template.request = requestTmpl;
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
