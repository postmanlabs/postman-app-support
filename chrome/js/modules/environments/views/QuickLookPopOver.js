var QuickLookPopOver = Backbone.View.extend({
    initialize: function() {
        var view = this;
        
        this.environments = this.options.environments;
        this.variableProcessor = this.options.variableProcessor;
        this.globals = this.options.globals;

        this.environments.on('change', this.render, this);
        this.variableProcessor.on('change:selectedEnv', this.render, this);

        this.globals.on('change:globals', this.render, this);

        $('#environment-quicklook').on("mouseenter", function () {
            $('#environment-quicklook-content').css("display", "block");
        });

        $('#environment-quicklook').on("mouseleave", function () {
            $('#environment-quicklook-content').css("display", "none");
        });


        $(document).bind('keydown', 'q', function () {
            view.toggleDisplay();
            return false;
        });

        this.render();
    },

    render: function() {
        var environment = this.environments.get(this.variableProcessor.get("selectedEnv"));

        if (!environment) {
            $('#environment-quicklook-environments h6').html("No environment");
            $('#environment-quicklook-environments ul').html("");
        }
        else {
            $('#environment-quicklook-environments h6').html(environment.get("name"));
            $('#environment-quicklook-environments ul').html("");
            $('#environment-quicklook-environments ul').append(Handlebars.templates.environment_quicklook({
                "items":environment.toJSON().values
            }));
        }

        if (!this.globals) {
            return;
        }

        $('#environment-quicklook-globals ul').html("");
        $('#environment-quicklook-globals ul').append(Handlebars.templates.environment_quicklook({
            "items":this.globals.get("globals")
        }));
    },

    toggleDisplay:function () {
        var display = $('#environment-quicklook-content').css("display");

        if (display === "none") {
            $('#environment-quicklook-content').css("display", "block");
        }
        else {
            $('#environment-quicklook-content').css("display", "none");
        }
    }
});