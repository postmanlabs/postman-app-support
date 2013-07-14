var DigestAuthForm = Backbone.View.extend({
    initialize: function() {
        this.model.on("change", this.render, this);

        var view = this;
        var model = this.model;

        $('#request-helper-digestAuth .request-helper-submit').on("click", function () {
            $('#request-helpers').css("display", "none");
            var helper = {
                id: "digest",
                time: new Date().getTime(),
                realm: $("#request-helper-digestAuth-realm").val(),
                username: $("#request-helper-digestAuth-username").val(),
                password: $("#request-helper-digestAuth-password").val(),
                nonce: $("#request-helper-digestAuth-nonce").val(),
                algorithm: $("#request-helper-digestAuth-algorithm").val(),
                nonceCount: $("#request-helper-digestAuth-nonceCount").val(),
                clientNonce: $("#request-helper-digestAuth-clientNonce").val(),
                opaque: $("#request-helper-digestAuth-opaque").val(),
                qop: $("#request-helper-digestAuth-qop").val()
            };

            model.set(helper);
            model.process();
        });

        $('#request-helper-digestAuth .request-helper-clear').on("click", function () {
            view.clearFields();
        });
    },

    clearFields: function () {
        $("#request-helper-digestAuth-realm").val("");
        $("#request-helper-digestAuth-username").val("");
        $("#request-helper-digestAuth-password").val("");
        $("#request-helper-digestAuth-nonce").val("");
        $("#request-helper-digestAuth-algorithm").val("");
        $("#request-helper-digestAuth-nonceCount").val("");
        $("#request-helper-digestAuth-clientNonce").val("");
        $("#request-helper-digestAuth-opaque").val("");
        $("#request-helper-digestAuth-qop").val("");

        //set values in the model
        var helper = {
            id: "digest",
            time: new Date().getTime(),
            realm: "",
            username: "",
            password: "",
            nonce: "",
            algorithm: "",
            nonceCount: "",
            clientNonce: "",
            opaque: "",
            qop: ""
        };

        this.model.set(helper);
    },

    save: function() {
        var helper = {
            id: "digest",
            time: new Date().getTime(),
            realm: $("#request-helper-digestAuth-realm").val(),
            username: $("#request-helper-digestAuth-username").val(),
            password: $("#request-helper-digestAuth-password").val(),
            nonce: $("#request-helper-digestAuth-nonce").val(),
            algorithm: $("#request-helper-digestAuth-algorithm").val(),
            nonceCount: $("#request-helper-digestAuth-nonceCount").val(),
            clientNonce: $("#request-helper-digestAuth-clientNonce").val(),
            opaque: $("#request-helper-digestAuth-opaque").val(),
            qop: $("#request-helper-digestAuth-qop").val()
        };

        //Replace this with the call to the model
        this.model.set(helper);
    },

    render: function() {
        $("#request-helper-digestAuth-realm").val(this.model.get("realm"));
        $("#request-helper-digestAuth-username").val(this.model.get("username"));
        $("#request-helper-digestAuth-algorithm").val(this.model.get("algorithm"));
        $("#request-helper-digestAuth-password").val(this.model.get("password"));
        $("#request-helper-digestAuth-nonce").val(this.model.get("nonce"));
        $("#request-helper-digestAuth-nonceCount").val(this.model.get("nonceCount"));
        $("#request-helper-digestAuth-clientNonce").val(this.model.get("clientNonce"));
        $("#request-helper-digestAuth-opaque").val(this.model.get("opaque"));
        $("#request-helper-digestAuth-qop").val(this.model.get("qop"));
    }
});