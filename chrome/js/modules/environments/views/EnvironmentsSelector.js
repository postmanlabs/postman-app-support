var EnvironmentSelector = Backbone.View.extend({
    environments: null,
    variableProcessor: null,

    initialize: function() {
        this.environments = this.options.environments;
        this.variableProcessor = this.options.variableProcessor;

        this.environments.on('change', this.render, this);
        this.environments.on('reset', this.render, this);
        this.environments.on('add', this.render, this);
        this.environments.on('remove', this.render, this);

        this.variableProcessor.on('change:selectedEnv', this.render, this);

        var environments = this.environments;
        var variableProcessor = this.variableProcessor;

        $('#environment-selector').on("click", ".environment-list-item", function () {
            var id = $(this).attr('data-id');
            var selectedEnv = environments.get(id);

            variableProcessor.set({"selectedEnv": selectedEnv});
            pm.settings.setSetting("selectedEnvironmentId", selectedEnv.id);
            $('#environment-selector .environment-list-item-selected').html(selectedEnv.name);
        });

        $('#environment-selector').on("click", ".environment-list-item-noenvironment", function () {
            variableProcessor.set({"selectedEnv": null});
            pm.settings.setSetting("selectedEnvironmentId", "");
            $('#environment-selector .environment-list-item-selected').html("No environment");
        });

        this.render();
    },

    render: function() {
        $('#environment-selector .dropdown-menu').html("");
        $('#environment-selector .dropdown-menu').append(Handlebars.templates.environment_selector({"items":this.environments.toJSON()}));
        $('#environment-selector .dropdown-menu').append(Handlebars.templates.environment_selector_actions());

        var selectedEnv = this.variableProcessor.get("selectedEnv");

        if (selectedEnv) {
            $('#environment-selector .environment-list-item-selected').html(selectedEnv.toJSON().name);
        }
        else {
            $('#environment-selector .environment-list-item-selected').html("No environment");
        }
    }
});
