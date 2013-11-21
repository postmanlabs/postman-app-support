var OAuth2Form = Backbone.View.extend({
    initialize: function() {
        this.model.on("change", this.render, this);

        var view = this;
        var model = this.model;

        $("#request-helper-oauth2-authorization-url").autocomplete({
            source: oAuth2AuthorizationUrls,
            delay: 50
        });

        $("#request-helper-oauth2-access-token-url").autocomplete({
            source: oAuth2TokenUrls,
            delay: 50
        });

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

        $('#request-helper-oAuth2 .request-helper-save').on("click", function () {
            var name = $("#request-helper-oauth2-name").val();
            var id = $(this).attr("data-id");

            var params = {
                "id": id,
                "name": name
            };

            pm.mediator.trigger("updateOAuth2Token", params);
        });

        pm.mediator.on("addedOAuth2Token", this.onAddedOAuth2Token, this);
    },

    onAddedOAuth2Token: function(params) {
        console.log(params);
        $('#request-helper-oAuth2-access-token-data').html("");
        $('#request-helper-oAuth2-access-token-data').append(Handlebars.templates.environment_quicklook({"items": params.data}));
        $("#request-helper-oAuth2 .request-helper-save").attr("data-id", params.id);
        this.showSaveForm();
    },

    showSaveForm: function() {
        $("#request-helper-oAuth2-access-tokens-container").css("display", "none");
        $("#request-helper-oAuth2-access-token-form").css("display", "none");
        $("#request-helper-oAuth2-access-token-save-form").css("display", "block");
    },

    showAccessTokens: function() {
        $("#request-helper-oAuth2-access-tokens-container").css("display", "block");
        $("#request-helper-oAuth2-access-token-save-form").css("display", "none");
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
