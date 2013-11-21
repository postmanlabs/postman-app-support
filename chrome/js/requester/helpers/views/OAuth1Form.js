var OAuth1Form = Backbone.View.extend({
    initialize: function() {
        this.model.on("change", this.render, this);

        var view = this;
        var model = this.model;

        $('#request-helper-oAuth1 .request-helper-submit').on("click", function () {
            $('#request-helpers').css("display", "none");
            view.save();
            model.process();
        });

        $('#request-helper-oAuth1 input').on("blur", function () {
            console.log("Save helper");
            view.save();
        });

        $('#request-helper-oAuth1 .request-helper-clear').on("click", function () {
            view.clearFields();
        });

        $('#request-helper-oauth1-auto').click(function () {
            var isAutoEnabled = $('#request-helper-oauth1-auto').attr('checked') ? true : false;

            model.set("auto", isAutoEnabled);

            if (!isAutoEnabled) {
                $('#request-helper-oAuth1 .request-helper-submit').css("display", "inline-block");
            }
            else {
                $('#request-helper-oAuth1 .request-helper-submit').css("display", "none");
            }
        });

        $('#request-helper-oauth1-header').click(function () {
            view.save();
        });
    },

    clearFields: function() {
        $("#request-helper-oauth1-consumerKey").val("");
        $("#request-helper-oauth1-consumerSecret").val("");
        $("#request-helper-oauth1-token").val("");
        $("#request-helper-oauth1-tokenSecret").val("");
        $("#request-helper-oauth1-signatureMethod").val("HMAC-SHA1");
        $("#request-helper-oauth1-timestamp").val("");
        $("#request-helper-oauth1-nonce").val("");
        $("#request-helper-oauth1-version").val("");
        $("#request-helper-oauth1-realm").val("");
        $("#request-helper-oauth1-header").prop("checked", false);
        $("#request-helper-oauth1-auto").prop("checked", false);

        var helper = {
            id: "oAuth1",
            time: new Date().getTime(),
            consumerKey: "",
            consumerSecret: "",
            token: "",
            tokenSecret: "",
            signatureMethod: "HMAC-SHA1",
            timestamp: "",
            nonce: "",
            version: "",
            realm: "",
            header: false,
            auto: false
        };

        this.model.set(helper);
    },

    save: function() {
        var helper = {
            id: "oAuth1",
            time: new Date().getTime(),
            consumerKey: $("#request-helper-oauth1-consumerKey").val(),
            consumerSecret: $("#request-helper-oauth1-consumerSecret").val(),
            token: $("#request-helper-oauth1-token").val(),
            tokenSecret: $("#request-helper-oauth1-tokenSecret").val(),
            signatureMethod: $("#request-helper-oauth1-signatureMethod").val(),
            timestamp: $("#request-helper-oauth1-timestamp").val(),
            nonce: $("#request-helper-oauth1-nonce").val(),
            version: $("#request-helper-oauth1-version").val(),
            realm: $("#request-helper-oauth1-realm").val(),
            header: $("#request-helper-oauth1-header").prop("checked"),
            auto: $("#request-helper-oauth1-auto").prop("checked")
        };

        this.model.set(helper);
    },

    render: function() {
        $("#request-helper-oauth1-consumerKey").val(this.model.get("consumerKey"));
        $("#request-helper-oauth1-consumerSecret").val(this.model.get("consumerSecret"));
        $("#request-helper-oauth1-token").val(this.model.get("token"));
        $("#request-helper-oauth1-tokenSecret").val(this.model.get("tokenSecret"));
        $("#request-helper-oauth1-signatureMethod").val(this.model.get("signatureMethod"));
        $("#request-helper-oauth1-timestamp").val(this.model.get("timestamp"));
        $("#request-helper-oauth1-nonce").val(this.model.get("nonce"));
        $("#request-helper-oauth1-version").val(this.model.get("version"));
        $("#request-helper-oauth1-realm").val(this.model.get("realm"));

        $("#request-helper-oauth1-header").prop("checked", this.model.get("header"));
        $("#request-helper-oauth1-auto").prop("checked", this.model.get("auto"));

        if (this.model.get("auto")) {
            $('#request-helper-oAuth1 .request-helper-submit').css("display", "none");
        }
        else {
            $('#request-helper-oAuth1 .request-helper-submit').css("display", "inline-block");
        }
    }
});
