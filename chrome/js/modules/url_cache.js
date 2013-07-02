pm.urlCache = {
    urls:[],
    addUrl:function (url) {
        if ($.inArray(url, this.urls) === -1) {
            pm.urlCache.urls.push(url);
            this.refreshAutoComplete();
        }
    },

    refreshAutoComplete:function () {
        if (pm.urlCache.urls.length === 0) {
            return;
        }

        try {
            $("#url").autocomplete({
                source:pm.urlCache.urls,
                delay:50
            });
        }
        catch(e) {
            console.log("urlCache:", "onbeforeunload error", e);
        }

    }
};