# gulp-swagger v1.0.0
--------------------------

| | |
| ----------- | ------------ |
| Package   | gulp-swagger |
| Description | [Gulp][gulp] plugin that parses [Swagger][swagger] specs in JSON or YAML format, validates against the official [Swagger 2.0 schema][swagger2spec], dereferences all $ref pointers, including pointers to external files and generates client-side API code. |
| Node Version | >= 0.8 |


Install
--------------------------

```js
npm install gulp-swagger
```


Usage
--------------------------

Output fully parsed schema:

```js
var gulp = require('gulp');
var swagger = require('gulp-swagger');

gulp.task('schema', function() {
  gulp.src('./src/api/index.yaml')
    .pipe(swagger('schema.json'))
    .pipe(gulp.dest('./build'));
});

gulp.task('default', ['schema']);
```


Generate client-side API based on schema for AngularJS:

```js
var gulp = require('gulp');
var swagger = require('gulp-swagger');

gulp.task('api', function() {
  gulp.src('./src/api/index.yaml')
    .pipe(swagger({
      filename: 'api.js',
      codegen: {
        type: 'angular' // type can be 'angular', 'node' or 'custom' (default).
      }
    }))
    .pipe(gulp.dest('./api'));
});

gulp.task('default', ['api']);

// Rerun the task when a file changes
gulp.task('watch', function () {
  gulp.watch('./src/api/*.yaml', ['api']);
});
```


Generate client-side API based on schema using custom templates:

```js
var gulp = require('gulp');
var swagger = require('gulp-swagger');

gulp.task('api', function() {
  gulp.src('./src/api/index.yaml')
    .pipe(swagger({
      filename: 'api.js',
      codegen: {
        template: {
          class: './src/templates/api-class.mustache',
          method: './src/templates/api-method.mustache',
          request: './src/templates/api-request.mustache'
        }
      }
    }))
    .pipe(gulp.dest('./api'));
});

gulp.task('default', ['api']);

// Rerun the task when a file changes
gulp.task('watch', function () {
  gulp.watch('./src/api/*.yaml', ['api']);
});
```


Differently from [Swagger to JS Codegen][swagger-js-codegen], Gulp-Swagger does not require the template field to be on the format `template: { class: "...", method: "...", request: "..." }`. You can pass either of them as you want. Eg. say that your custom `method` and `request` are super simple and you only really need one `class` template, you could only pass `template: { class: "..." }`. For this reason, as a shortcut, `template` can also be a string: `template: "..."`. Gulp-Swagger allows to you pass mustache options along to Codegen.

```js
var gulp = require('gulp');
var swagger = require('gulp-swagger');

gulp.task('api', function() {
  gulp.src('./src/api/index.yaml')
    .pipe(swagger({
      filename: 'api.js',
      codegen: {
        template: './src/templates/api.mustache',
        mustache: {
          // E.g. Passing variables to mustache to envify the templates...
          NODE_ENV: process.env.NODE_ENV
        }
      }
    }))
    .pipe(gulp.dest('./api'));
});

gulp.task('default', ['api']);

// Rerun the task when a file changes
gulp.task('watch', function () {
  gulp.watch('./src/api/*.yaml', ['api']);
});
```

Hadling Circular reference object :

While parsing the JSON back from the string use "circular-json" to parse the string to JSON by filling all the circular reference.

```js
var CircularJSON = require('circular-json');

CircularJSON.parse(jsonString);
```

Gulp-Swagger also passes the swagger schema to mustache options, both as an object (`swaggerObject`) and as a stringified JSON (`swaggerJSON`). Better even, there's also a compilation of all JSON-schemas passed to mustache options, handy if you want to carry on schema validation on the client-side. So inside your mustache template, you can do things like:

```
var basePath = '{{&swaggerObject.basePath}}'; // swagger js object you can traverse
var swagger = {{&swaggerJSON}}; // swagger schema, JSON-stringified
var schemas = {{&JSONSchemas}}; // compilation of all request/response body JSON schemas, JSON-stringified
```

The `JSONSchemas` mustache variable will render as:

```
var schemas = {
  "/pets": {
    "get": {
      "responses": {
        "200": {
          "type": "array",
          "items": {
            "required": ["id", "name"],
            "properties": {
              "id": {
                "type": "integer",
                "format": "int64"
              },
              "name": {
                "type": "string"
              },
              "tag": {
                "type": "string"
              }
            }
          }
        },
        "default": {
          "required": ["code", "message"],
          "properties": {
            "code": {
              "type": "integer",
              "format": "int32"
            },
            "message": {
              "type": "string"
            }
          }
        }
      }
    },
    "post": {
      "responses": {
        "200": {
          "required": ["id", "name"],
          "properties": {
            "id": {
              "type": "integer",
              "format": "int64"
            },
            "name": {
              "type": "string"
            },
            "tag": {
              "type": "string"
            }
          }
        },
        "default": {
          "required": ["code", "message"],
          "properties": {
            "code": {
              "type": "integer",
              "format": "int32"
            },
            "message": {
              "type": "string"
            }
          }
        }
      }
    }
  },
  "/pets/{id}": {
    "get": {
      "responses": {
        "200": {
          "required": ["id", "name"],
          "properties": {
            "id": {
              "type": "integer",
              "format": "int64"
            },
            "name": {
              "type": "string"
            },
            "tag": {
              "type": "string"
            }
          }
        },
        "default": {
          "required": ["code", "message"],
          "properties": {
            "code": {
              "type": "integer",
              "format": "int32"
            },
            "message": {
              "type": "string"
            }
          }
        }
      }
    },
    "delete": {
      "responses": {
        "204": {},
        "default": {
          "required": ["code", "message"],
          "properties": {
            "code": {
              "type": "integer",
              "format": "int32"
            },
            "message": {
              "type": "string"
            }
          }
        }
      }
    }
  }
};
```

Note: By default, the parser will dereference all internal $refs, which could result in a  bloated json when many paths share the same schema/parameters/responses, etc. You can have fine grained control over the parser by using the `parser` option which you can use to customize how the API is parsed, resolved, dereferenced, etc. For usage, please refer to the [SwaggerParser Options Documentation](https://github.com/BigstickCarpet/swagger-parser/blob/master/docs/options.md).

```
    .pipe(swagger({
      filename: 'api.js',
      parser: {/* swagger-parser options */}
    })
```


Example Implementation
--------------------------
The provided example implements client-side JSON schema validation using [tv4][tv4] of both Ajax requests and responses.

To play with the example, download this repo. Point your terminal to the example folder and run: `$ npm run setup`. Then open `http://localhost:8888` in your browser, open the dev tools console and play around with the `API` global object.


Roadmap
--------------------------
- [ ] Test coverage
- [ ] Built-in schema validation


See Also
--------------------------

- [Gulp][gulp]
- [Swagger][swagger]
- [Swagger-Parser][swagger-parser]
- [Swagger to JS Codegen][swagger-js-codegen]


Contributing
--------------------------
I welcome any contributions, enhancements, and bug-fixes. [File an issue](https://github.com/gersongoulart/gulp-swagger/issues) on GitHub and [submit a pull request](https://github.com/gersongoulart/gulp-swagger/pulls).


License
--------------------------
Gulp-Swagger is 100% free and open-source, under the [MIT license](LICENSE). Use it however you want.

[gulp]: http://github.com/gulpjs/gulp
[swagger]: http://swagger.io
[swagger2spec]: https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md
[swagger-parser]: https://github.com/BigstickCarpet/swagger-parser
[swagger-tools]: https://github.com/apigee-127/swagger-tools
[swagger-js-codegen]: https://github.com/wcandillon/swagger-js-codegen
[tv4]: https://github.com/geraintluff/tv4
