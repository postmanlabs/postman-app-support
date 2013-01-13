pm.urlCache = {
    urls:[],
    addUrl:function (url) {
        if ($.inArray(url, this.urls) == -1) {
            pm.urlCache.urls.push(url);
            this.refreshAutoComplete();
        }
    },

    refreshAutoComplete:function () {
        $("#url").autocomplete({
            source:pm.urlCache.urls,
            delay:50
        });
    }
};