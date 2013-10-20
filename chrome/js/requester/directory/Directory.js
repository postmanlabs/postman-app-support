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

    reload: function() {
        this.startId = 0;
        this.fetchCount = 42;
        this.lastCount = 0;
        this.totalCount = 0;
        this.getCollections(this.startId, this.fetchCount, "descending");
    },

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

    	pm.api.getDirectoryCollections(startId, count, order, function (collections) {
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
        });
    },

    downloadCollection: function(linkId) {
        // TODO Check if the collection is uploaded by the user
        // TODO Download using remote ID
        var remoteId = pm.user.getRemoteIdForLinkId(linkId);

        console.log("Found remoteId", remoteId);
        if (remoteId) {
            pm.user.downloadSharedCollection(remoteId, function() {

                pm.mediator.trigger("notifySuccess", "Downloaded collection");
            });
        }
        else {
            pm.api.downloadDirectoryCollection(linkId, function (data) {
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
    }

});