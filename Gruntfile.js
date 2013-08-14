/*global module:false*/
module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    concat: {
      dist: {
        src: ['chrome/js/modules/**/*.js'],
        dest: 'chrome/js/requester.js'
      },
      requester_html: {
        src: [
        'chrome/html/requester/header.html',
        'chrome/html/requester/sidebar.html',
        'chrome/html/requester/main.html',
        'chrome/html/requester/loggers/*.html',
        'chrome/html/requester/modals/*.html',
        'chrome/html/requester/footer.html'
        ],
        dest: 'chrome/requester.html'
      },
      requester_tester: {
        src: [
        'chrome/html/requester/header.html',
        'chrome/html/requester/sidebar.html',
        'chrome/html/requester/main.html',
        'chrome/html/requester/modals/*.html',
        'chrome/html/requester/loggers/*.html',
        'chrome/html/requester/footer.html',
        'chrome/html/requester/tester.html'
        ],
        dest: 'chrome/tester.html'
      }
    },

    mindirect: {
      dist: {
        src: ['chrome/js/requester.js'],
        dest: 'chrome/js/requester.min.js'
      }
    },

    watch: {
      requester_templates: {
        files: ['chrome/js/templates/*'],
        tasks: ['handlebars']
      },

      requester_js: {
        files: ['chrome/js/modules/**/*.js'],
        tasks: ['concat:dist']
      },

      requester_html: {
        files: ['chrome/html/requester/*', 'chrome/html/requester/modals/*', 'chrome/html/requester/loggers/*'],
        tasks: ['concat:requester_html', 'concat:requester_tester']
      },

      requester_css: {
        files: ['chrome/css/styles.scss'],
        tasks: ['sass']
      }
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
    },

    sass: {
      dist: {
        files: {
          'chrome/css/styles.css': 'chrome/css/styles.scss'
        }
      }
    },

    compress: {
      main: {
          options: {
            archive: 'releases/v0.9.2.zip'
          },
          files: [
            {src: ['chrome/**', '!chrome/tests/**', '!chrome/manifest_key.json', '!chrome/tester.html'], dest: '/'}, // includes files in path and its subdirs
          ]
        }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mindirect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-compress');

  // Default task.
  grunt.registerTask('default', ['jshint', 'concat']);
  grunt.registerTask('package', ['concat', 'handlebars', 'sass', 'compress']);

};