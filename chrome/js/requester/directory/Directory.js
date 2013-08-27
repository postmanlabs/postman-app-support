var DirectoryCollection = Backbone.Model.extend({
    defaults: function() {
        return {
            "id": "",
            "name": "",
            "description": "",
            "order": [],
            "folders": [],
            "requests": [],
            "timestamp": 0,
            "updated_at": "",
            "updated_at_formatted": ""
        };
    }
});

var Directory = Backbone.Collection.extend({
    model: DirectoryCollection,

    startId: 0,
    fetchCount: 42,
    lastCount: 0,
    totalCount: 0,
    order: "descending",

    isInitialized: false,

    initialize: function() {
    	pm.mediator.on("initializeDirectory", this.onInitializeDirectory, this);
        pm.mediator.on("getDirectoryCollection", this.onGetDirectoryCollection, this);
        pm.mediator.on("showNextDirectoryPage", this.onShowNextDirectoryPage, this);
        pm.mediator.on("showNextDirectoryPage", this.onShowNextDirectoryPage, this);
    },

    onInitializeDirectory: function() {
    	if (!this.isInitialized) {
    		this.isInitialized = true;
    		this.getCollections(this.startId, this.fetchCount, "descending");
    	}
    },

    onGetDirectoryCollection: function(link_id) {
        this.downloadCollection(link_id);
    },

    loadNext: function() {
        this.getCollections(this.startId, this.fetchCount, "descending");
    },

    loadPrevious: function() {
        this.getCollections(this.startId, this.fetchCount, "ascending");
    },

    getCollections: function(startId, count, order) {
    	var collection = this;

    	var getUrl = pm.webUrl + "/collections";
    	getUrl += "?user_id=" + pm.user.get("id");
    	getUrl += "&access_token=" + pm.user.get("access_token");
    	getUrl += "&start_id=" + startId;
    	getUrl += "&count=" + count;
    	getUrl += "&order=" + order;

    	$.ajax({
    	    type:'GET',
    	    url:getUrl,
    	    success:function (collections) {
                var c;
                var i;
                var updated_at_formatted;

                if (order === "descending") {
                    collection.startId = parseInt(collections[collections.length - 1].id, 10);
                    collection.totalCount += collections.length;
                }
                else {
                    collection.startId = parseInt(collections[0].id, 10);
                    collection.totalCount -= collection.lastCount;
                }

                collection.lastCount = collections.length;

    	    	if(collections.hasOwnProperty("message")) {
    	    		// Signal error
    	    	}
    	    	else {
                    for(i = 0; i < collections.length; i++) {
                        c = collections[i];
                        updated_at_formatted = new Date(c.updated_at).toDateString();
                        c.updated_at_formatted = updated_at_formatted;
                    }

                    collection.reset([]);
                    collection.add(collections, {merge: true});
    	    	}

    	    }
    	});
    },

    downloadCollection: function(link_id) {
        var getUrl = pm.webUrl + "/collections/" + link_id;
        getUrl += "?user_id=" + pm.user.get("id");
        getUrl += "&access_token=" + pm.user.get("access_token");

        $.get(getUrl, function (data) {
            try {
                var collection = data;
                pm.mediator.trigger("notifySuccess", "Downloaded collection");
                pm.mediator.trigger("addDirectoryCollection", collection);
            }
            catch(e) {
                pm.mediator.trigger("notifyError", "Failed to download collection");
                pm.mediator.trigger("failedCollectionImport");
            }

        });
    }

});