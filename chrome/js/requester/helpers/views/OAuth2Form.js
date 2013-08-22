var OAuth2Form = Backbone.View.extend({
    initialize: function() {
        this.model.on("change", this.render, this);

        var view = this;
        var model = this.model;


        $("#request-helper-oAuth2 .request-helper-back").on("click", function () {
            view.save();
            view.showAccessTokens();
        });

        $('#request-helper-oAuth2 .request-helper-submit').on("click", function () {
            var params = {
                "authorization_url": $("#request-helper-oauth2-authorization-url").val(),
                "access_token_url": $("#request-helper-oauth2-access-token-url").val(),
                "client_id": $("#request-helper-oauth2-client-id").val(),
                "client_secret": $("#request-helper-oauth2-client-secret").val(),
                "scope": $("#request-helper-oauth2-scope").val()
            };

            view.save();
            model.trigger("startAuthorization", params);
        });
    },

    showAccessTokens: function() {
        $("#request-helper-oAuth2-access-tokens-container").css("display", "block");
        $("#request-helper-oAuth2-access-token-form").css("display", "none");
    },

    save: function() {
        var helper = {
            "id": "oAuth2",
            "authorization_url": $("#request-helper-oauth2-authorization-url").val(),
            "access_token_url": $("#request-helper-oauth2-access-token-url").val(),
            "client_id": $("#request-helper-oauth2-client-id").val(),
            "client_secret": $("#request-helper-oauth2-client-secret").val(),
            "scope": $("#request-helper-oauth2-scope").val(),
            "time": new Date().getTime()
        };

        console.log("Save", helper);

        this.model.set(helper);
    },

    render: function() {
        $("#request-helper-oauth2-authorization-url").val(this.model.get("authorization_url"));
        $("#request-helper-oauth2-access-token-url").val(this.model.get("access_token_url"));
        $("#request-helper-oauth2-client-id").val(this.model.get("client_id"));
        $("#request-helper-oauth2-client-secret").val(this.model.get("client_secret"));
        $("#request-helper-oauth2-scope").val(this.model.get("scope"));
    }
});
