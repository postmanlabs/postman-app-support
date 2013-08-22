var Helpers = Backbone.Model.extend({
    defaults: function() {
        return {
            "activeHelper": "normal",
            "basicAuth": null,
            "digestAuth": null,
            "oAuth1": null,
            "oAuth2": null
        };
    }
});