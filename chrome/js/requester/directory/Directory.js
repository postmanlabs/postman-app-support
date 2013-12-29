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
    endId: 0,
    fetchCount: 44,
    lastCount: 0,
    totalCount: 0,
    order: "descending",

    isInitialized: false,

    reload: function() {
        this.startId = 0;
        this.fetchCount = 44;
        this.lastCount = 0;
        this.totalCount = 0;
        this.getCollections(this.startId, this.fetchCount, "descending");
    },

    comparator: function(a, b) {
        var aName = a.get("timestamp");
        var bName = b.get("timestamp");

        return aName > bName;
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
        this.getCollections(this.endId, this.fetchCount, "descending");
    },

    loadPrevious: function() {
        this.getCollections(this.startId, this.fetchCount, "ascending");
    },

    getCollections: function(startId, count, order) {
    	var collection = this;

        console.log("Getting collections", startId, "Count", count, "Order", order);

    	pm.api.getDirectoryCollections(startId, count, order, function (collections) {
            var c;
            var i;
            var updated_at_formatted;

            if (order === "descending") {
                collection.totalCount += collections.length;
            }
            else {
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
                    c.timestamp = new Date(c.updated_at).getTime();
                }

                collections.sort(sortById);

                collection.reset([]);
                collection.add(collections, {merge: true});

                collection.startId = parseInt(collections[0].id, 10);
                collection.endId = parseInt(collections[collections.length - 1].id, 10);
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