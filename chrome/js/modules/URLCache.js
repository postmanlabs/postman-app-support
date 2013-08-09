var URLCache = Backbone.Model.extend({
    defaults: function() {
        return {
            "urls": []
        }
    },

    initialize: function() {
        var model = this;

        pm.mediator.on("addToURLCache", function(url) {
            model.addUrl(url);
        });
    },

    addUrl:function (url) {
        var urls = this.get("urls");

        if ($.inArray(url, urls) === -1) {
            urls.push(url);
        }
    },

    getUrls: function() {
        return this.get("urls");
    }
});