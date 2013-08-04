var PmCollection = Backbone.Model.extend({
    defaults: function() {
        return {
            "id": "",
            "name": "",
            "order": [],
            "folders": [],
            "requests": [],
            "timestamp": 0
        };
    },

    setRequests: function(requests) {
        this.set("requests", requests);
        this.orderRequests();
    },

    // Order requests or put them in folders when initialized
    orderRequests: function() {
        var order = this.get("order");
        var requests = _.clone(this.get("requests"));

        function requestFinder(request) {
            return request.id === order[j]
        }

        if (order.length === 0) {
            requests.sort(sortAlphabetical);
        }
        else {                                        
            var orderedRequests = [];
            for (var j = 0, len = order.length; j < len; j++) {
                var element = _.find(requests, requestFinder);
                if(typeof element !== "undefined") {
                    orderedRequests.push(element);    
                }                
            }

            requests = orderedRequests;            
        }

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
    	this.get("requests").push(newRequest);
    },

    deleteRequest: function(request) {
    	var location = this.getRequestIndex(request);
    	var requests = this.get("requests");
    	if (location !== -1) {
    		requests.splice(location, 1);
            this.removeRequestIdFromOrderOrFolder(request);
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
        var index = arrayObjectIndexOf(folders, "id", id);
        folders.splice(index, 1, folder);
        this.set("folders", folders);
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
            "order": this.get("order"),
            "folders": this.get("folders"),
            "timestamp": this.get("timestamp")
        }
    },

    addRequestIdToFolder: function(id, requestId) {
        var folders = _.clone(this.get("folders"));
        var index = arrayObjectIndexOf(folders, id, "id");        
        folders[index].order.push(requestId);
        this.set("folders", folders);
    },

    removeRequestIdFromOrderOrFolder: function(requestId) {
        var order = _.clone(this.get("order"));
        var folders = _.clone(this.get("folders"));

        var indexInOrder = order.indexOf(requestId);
        if (indexInOrder >= 0) {
            order.splice(indexInOrder, 1);
            this.set("order", order);
        }
        else {
            var indexInSubFolder;
            for(var i = 0; i < folders.length; i++) {
                indexInFolder = folders[i].order.indexOf(requestId);
                if(indexInSubFolder >= 0) {
                    break;
                }
            }

            if(indexInSubFolder >= 0) {
                folders[i].requests.splice(indexInFolder, 1);
                this.set("folders", folders);
            }
        }

    }

});