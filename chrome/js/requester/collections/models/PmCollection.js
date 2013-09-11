/****

collectionRequest = {
    id: guid(),
    headers: request.getPackedHeaders(),
    url: url,
    method: request.get("method"),
    data: body.get("dataAsObjects"),
    dataMode: body.get("dataMode"),
    name: newRequestName,
    description: newRequestDescription,
    descriptionFormat: "html",
    time: new Date().getTime(),
    version: 2,
    responses: []
};

*****/
var PmCollection = Backbone.Model.extend({
    defaults: function() {
        return {
            "id": "",
            "name": "",
            "description": "",
            "order": [],
            "folders": [],
            "requests": [],
            "timestamp": 0,
            "synced": false,
            "syncedFilename": "",
            "remote_id": 0
        };
    },

    toSyncableJSON: function() {
        var j = this.getAsJSON();
        j.synced = true;
        return j;
    },

    setRequests: function(requests) {
        this.set("requests", requests);
    },

    getRequestIndex: function(newRequest) {
    	var requests = this.get("requests");
    	var count = requests.length;
    	var request;
    	var found;
    	var location;

    	for(var i = 0; i < count; i++) {
    		request = requests[i];
    		if(request.id === newRequest.id) {
    			found = true;
    			location = i;
    			break;
    		}
    	}

    	if (found) {
    		return location;
    	}
    	else {
    		return -1;
    	}
    },

    addRequest: function(newRequest) {
        var location = this.getRequestIndex(newRequest);
        var requests = this.get("requests");
        if (location !== -1) {
            requests.splice(location, 1, newRequest);
        }
        else {
            requests.push(newRequest);
        }
    },

    deleteRequest: function(requestId) {
        var requests = _.clone(this.get("requests"));
    	var location = arrayObjectIndexOf(requests, requestId, "id");
    	if (location !== -1) {
            this.removeRequestIdFromOrderOrFolder(requestId);
    		requests.splice(location, 1);
            this.set("requests", requests);
    	}
    },

    updateRequest: function(newRequest) {
    	var location = this.getRequestIndex(newRequest);
    	var requests = this.get("requests");
    	if (location !== -1) {
    		requests.splice(location, 1, newRequest);
    	}
    },

    addFolder: function(folder) {
        var folders = _.clone(this.get("folders"));
        folders.push(folder);
        this.set("folders", folders);
    },

    editFolder: function(folder) {
        function existingFolderFinder(f) {
            return f.id === id;
        }

        var id = folder.id;
        var folders = _.clone(this.get("folders"));
        var index = arrayObjectIndexOf(folders, id, "id");

        if (index !== -1) {
            folders.splice(index, 1, folder);
            this.set("folders", folders);
        }
    },

    deleteFolder: function(id) {
        var folders = _.clone(this.get("folders"));
        var index = arrayObjectIndexOf(folders, id, "id");
        folders.splice(index, 1);
        this.set("folders", folders);
    },

    getAsJSON: function() {
        return {
            "id": this.get("id"),
            "name": this.get("name"),
            "description": this.get("description"),
            "order": this.get("order"),
            "folders": this.get("folders"),
            "timestamp": this.get("timestamp"),
            "synced": this.get("synced"),
            "remote_id": this.get("remote_id")
        }
    },

    addRequestIdToFolder: function(id, requestId) {
        this.removeRequestIdFromOrderOrFolder(requestId);

        var folders = _.clone(this.get("folders"));
        var index = arrayObjectIndexOf(folders, id, "id");
        folders[index].order.push(requestId);
        this.set("folders", folders);
    },

    addRequestIdToOrder: function(requestId) {
        this.removeRequestIdFromOrderOrFolder(requestId);

        var order = _.clone(this.get("order"));
        order.push(requestId);
        this.set("order", order);
    },

    removeRequestIdFromOrderOrFolder: function(requestId) {
        var order = _.clone(this.get("order"));
        var indexInFolder;
        var folders = _.clone(this.get("folders"));

        var indexInOrder = order.indexOf(requestId);

        if (indexInOrder >= 0) {
            order.splice(indexInOrder, 1);
            this.set("order", order);
        }

        for(var i = 0; i < folders.length; i++) {
            indexInFolder = folders[i].order.indexOf(requestId);
            if(indexInFolder >= 0) {
                break;
            }
        }

        if(indexInFolder >= 0) {
            folders[i].order.splice(indexInFolder, 1);
            this.set("folders", folders);
        }
    },

    isUploaded: function() {
        return this.get("remote_id") !== 0;
    }
});