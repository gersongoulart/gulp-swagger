var gulp = require('gulp');
var swagger = require('gulp-swagger');
var schema = '' +
	// // Pick one for the demo:
	// './src/schemas/json/petstore-expanded.json';
	// './src/schemas/json/petstore-minimal.json';
	// './src/schemas/json/petstore-simple.json';
	// './src/schemas/json/petstore-with-external-docs.json';
	// './src/schemas/json/petstore.json';
	// './src/schemas/yaml/api-with-examples.yaml';
	'./src/schemas/yaml/petstore-expanded.yaml';
	// './src/schemas/yaml/petstore.yaml';
	// './src/schemas/yaml/uber.yaml';

gulp.task('copy-index-html', function () {
	return gulp
		.src('./src/index.html')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-index-js', function () {
	return gulp
		.src('./src/index.js')
		.pipe(gulp.dest('./dist'));
});

gulp.task('generate-api', function() {
	return gulp
		.src(schema)
		.pipe(
			swagger({
				filename: 'api.js',
				codegen: {
					template: {
						class: './src/templates/api-class.mustache',
						method: './src/templates/api-method.mustache'
					}
				}
			})
		)
		.pipe(gulp.dest('./dist'));
});

gulp.task('default', ['copy-index-html', 'copy-index-js', 'generate-api']);
