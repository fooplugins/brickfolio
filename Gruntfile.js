'use strict';

module.exports = function (grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			files: ['dist']
		},
		uglify: {
			prod: {
				options: {
					preserveComments: 'some',
					mangle: {
						except: [ "undefined" ]
					}
				},
				files: {
					'dist/js/jquery.brickfolio.min.js': [ 'src/js/jquery.brickfolio.js' ]
				}
			}
		},	
		cssmin: {
			minify: {
				src: [ 'src/css/brickfolio.animations.css' ],
				dest: 'dist/css/brickfolio.min.css'
			}
		}
	});

	// Load grunt tasks
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	// Default task.
	grunt.registerTask('default', ['clean', 'uglify', 'cssmin']);
};
