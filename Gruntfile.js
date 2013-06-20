/*global module:false*/
module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({    
    concat: {
      dist: {
        src: ['chrome/js/modules/*.js'],
        dest: 'chrome/js/requester.js'
      },
      html: {
        src: [
          'chrome/html/requester/header.html', 
          'chrome/html/requester/sidebar.html',
          'chrome/html/requester/main.html',
          'chrome/html/requester/modals/*.html', 
          'chrome/html/requester/footer.html'
          ],
        dest: 'chrome/requester.html'
      }
    },
    mindirect: {
      dist: {
        src: ['chrome/js/requester.js'],
        dest: 'chrome/js/requester.min.js'
      }
    },
    watch: {
      files: ['chrome/js/modules/*.js', 'chrome/js/templates/*', 'chrome/html/requester/modals/*', 'chrome/html/requester/*'],
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
