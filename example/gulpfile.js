var gulp = require('gulp');
var swagger = require('gulp-swagger');
var schema = '' +
	// // Pick one for the demo:
	// './schemas/json/petstore-expanded.json';
	// './schemas/json/petstore-minimal.json';
	// './schemas/json/petstore-simple.json';
	// './schemas/json/petstore-with-external-docs.json';
	// './schemas/json/petstore.json';
	// './schemas/yaml/api-with-examples.yaml';
	'./schemas/yaml/petstore-expanded.yaml';
	// './schemas/yaml/petstore.yaml';
	// './schemas/yaml/uber.yaml';

gulp.task('default', function() {
	// place code for your default task here
	return gulp
		.src(schema)
		.pipe(
			swagger({
				filename: 'api.js',
				codegen: {
					template: {
						class: './templates/api-class.mustache',
						method: './templates/api-method.mustache'
					}
				}
			})
		)
		.pipe(gulp.dest('./'));
});