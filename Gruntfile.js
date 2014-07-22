'use strict';

module.exports = function(grunt) {
	var BASE_DIR = './';
	var SRC_DIR = BASE_DIR + 'src/';
	var DIST_DIR = BASE_DIR + 'dist/';
	var DEMO_DIR = BASE_DIR + 'demo/';
	var ANY_SUB_DIR = '**/';
	var ANY_JS_FILE = '*.js';

	grunt.initConfig({
		pkg: function() {
			return grunt.file.readJSON('package.json');
		},
		jshint: {
			all: [
				SRC_DIR + ANY_SUB_DIR + ANY_JS_FILE,
				DEMO_DIR + ANY_SUB_DIR + ANY_JS_FILE
			],
			options: {
				jshintrc: '.jshintrc'
			}
		},
		connect: {
			server: {
				options: {
					keepalive: true,
					port: 8003,
					hostname: 'localhost'
				}
			}
		},
		concat: {
			options: {
				banner: '/*! <%= pkg().name %> - v<%= pkg().version %> - ' +
					'<%= grunt.template.today("yyyy-mm-dd") %> */'
			},
			build: {
				files: [
					{
						src: [
							SRC_DIR + 'CustomSelection.js',
							SRC_DIR + ANY_SUB_DIR + ANY_JS_FILE
						],
						dest: DIST_DIR + 'custom-selection.js'
					}
				]
			}
		},
		uglify: {
			options: {
				sourceMap: true,
				banner: '/*! <%= pkg().name %> - v<%= pkg().version %> - ' +
					'<%= grunt.template.today("yyyy-mm-dd") %> */'
			},
			build: {
				files: [
					{
						src: [DIST_DIR + 'custom-selection.js'],
						dest: DIST_DIR + 'custom-selection.min.js'
					}
				]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('dist', ['jshint', 'concat:build', 'uglify:build']);
	grunt.registerTask('server', ['connect:server']);
};