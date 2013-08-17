var BasicAuthForm = Backbone.View.extend({
    initialize: function() {
        this.model.on("change:username", this.render, this);
        this.model.on("change:password", this.render, this);

        var view = this;
        var model = this.model;

        $('#request-helper-basicAuth .request-helper-submit').on("click", function () {
            $('#request-helpers').css("display", "none");
            var username = $('#request-helper-basicAuth-username').val();
            var password = $('#request-helper-basicAuth-password').val();

            model.set({"username": username, "password": password});
            model.process();
        });

        $('#request-helper-basicAuth .request-helper-clear').on("click", function () {
            view.clearFields();
        });
    },

    clearFields: function() {
        this.model.set({"username": "", "password": ""});
        $('#request-helper-basicAuth-username').val("");
        $('#request-helper-basicAuth-password').val("");
    },

    save: function() {
        var username = $('#request-helper-basicAuth-username').val();
        var password = $('#request-helper-basicAuth-password').val();
        this.model.set({"username": username, "password": password});
    },

    render: function() {
        $('#request-helper-basicAuth-username').val(this.model.get("username"));
        $('#request-helper-basicAuth-password').val(this.model.get("password"));
    }
});
