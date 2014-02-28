/*global module:false*/
module.exports = function(grunt) {
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
    concat: {
      dist: {
        src: ['chrome/js/modules/*.js'],
        dest: 'chrome/js/requester.js'
      }
    },
    mindirect: {
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
      compile: {
        options: {
          partialsUseNamespace: true,
          namespace: 'Handlebars.templates',
          processPartialName: function(filePath) {
            var pieces = filePath.split("/");
            var name = pieces[pieces.length - 1].split(".")[0];
            return name;
          },
          processName: function(filePath) {
            var pieces = filePath.split("/");
            var name = pieces[pieces.length - 1].split(".")[0];
            return name;
          }
        },
        files: {
          "chrome/js/templates.js": "chrome/js/templates/*"
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mindirect');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', ['jshint', 'concat']);

};
