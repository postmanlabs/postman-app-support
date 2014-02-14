var WsseForm = Backbone.View.extend({
    initialize: function() {
        this.model.on("change:username", this.render, this);
        this.model.on("change:password", this.render, this);

        var view = this;
        var model = this.model;

        $('#request-helper-wsse .request-helper-submit').on("click", function () {
            $('#request-helpers').css("display", "none");
            var username = $('#request-helper-wsse-username').val();
            var password = $('#request-helper-wsse-password').val();

            model.set({"username": username, "password": password});
            model.process();
        });

        $('#request-helper-wsse .request-helper-clear').on("click", function () {
            view.clearFields();
        });
    },

    clearFields: function() {
        this.model.set({"username": "", "password": ""});
        $('#request-helper-wsse-username').val("");
        $('#request-helper-wsse-password').val("");
    },

    save: function() {
        var username = $('#request-helper-wsse-username').val();
        var password = $('#request-helper-wsse-password').val();
        this.model.set({"username": username, "password": password});
    },

    render: function() {
        $('#request-helper-wsse-username').val(this.model.get("username"));
        $('#request-helper-wsse-password').val(this.model.get("password"));
    }
});
