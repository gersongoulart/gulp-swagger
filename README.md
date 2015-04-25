# gulp-swagger v0.0.3
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

Generate client-side API based on schema:

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

Differently from [Swagger to JS Codegen][swagger-js-codegen], Gulp-Swagger does not require the template field to be on the format `template: { class: "...", method: "...", request: "..." }`. You can pass either of them as you want. Eg. say that your custom `method` and `request` are super simple and you only really need one `class` template, you could only pass `template: { class: "..." }`. For this reason, as a shortcut, `template` can also be a string: `template: "..."`

Gulp-Swagger allows to you pass mustache options along to Codegen. Gulp-Swagger also passes the swagger schema as well as a compilation of all JSON-schemas to mustache options. This is useful if you want to carry schema validation validation on the client-side:

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
          // Silly E.g. Pasing variables to mustache to envify the templates...
          process: { env: { NODE_ENV: process.env.NODE_ENV } }
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

So inside your mustache template, you can:

```
var swagger = {{&swagger}};
var schemas = {{&JSONSchemas}};
```

The `JSONSchemas` mustache variable will render as somehing like:

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


Roadmap
--------------------------
- [ ] Test coverage
- [ ] Implementation Examples
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
[swagger-parser]: https://github.com/gersongoulart/gulp-swagger
[swagger-js-codegen]: https://github.com/wcandillon/swagger-js-codegen
