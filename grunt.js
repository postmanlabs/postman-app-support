/*global module:false*/
module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-handlebars');
  // Project configuration.
  grunt.initConfig({
    meta: {
      version: '0.1.0',
      banner: '/*! PROJECT_NAME - v<%= meta.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '* http://PROJECT_WEBSITE/\n' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
        'YOUR_NAME; Licensed MIT */'
    },
    lint: {
      files: ['grunt.js', 'chrome/js/requester.min.js']
    },
    qunit: {
      files: ['tests/**/*.html']
    },
    concat: {
      dist: {
        src: ['chrome/js/modules/*.js'],
        dest: 'chrome/js/requester.js'
      }
    },
    min: {
      dist: {
        src: ['chrome/js/requester.js'],
        dest: 'chrome/js/requester.min.js'
      }
    },
    watch: {
      files: ['chrome/js/modules/*.js', 'chrome/js/templates/*'],
      tasks: ['concat', 'handlebars']
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {
        jQuery: true
      }
    },
    handlebars: {
      all: {
        src: 'chrome/js/templates',
        dest: 'chrome/js/templates.js'
      }
    },
    uglify: {}
  });

  // Default task.
  grunt.registerTask('default', 'lint qunit concat min');

};
