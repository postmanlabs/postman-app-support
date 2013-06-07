pm.urlCache = {
    urls:[],
    addUrl:function (url) {        
        if ($.inArray(url, this.urls) == -1) {
            pm.urlCache.urls.push(url);
            this.refreshAutoComplete();
        }        
    },

    refreshAutoComplete:function () {        
        console.log(pm.urlCache.urls);

        if (pm.urlCache.urls.length == 0) return;

        /*
        $("#url").autocomplete({
            source:pm.urlCache.urls,
            delay:50,
            select:function (event, item) {
            }
        });        
*/
    }
};