var URLCache = Backbone.Model.extend({
    defaults: function() {
        return {
            "urls": []
        }
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