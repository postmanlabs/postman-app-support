var PmCollection = Backbone.Model.extend({
    defaults: function() {
        return {
            "id": "",
            "order": [],
            "folders": [],
            "requests": [],
            "timestamp": 0
        };
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

    deleteRequest: function(newRequest) {
    	var location = this.getRequestIndex(newRequest);
    	var requests = this.get("requests");
    	if (location !== -1) {
    		requests.splice(location, 1);
    	}
    },

    updateRequest: function(newRequest) {
    	var location = this.getRequestIndex(newRequest);
    	var requests = this.get("requests");
    	if (location !== -1) {
    		requests.splice(location, 1, newRequest);
    	}
    },

    getAsJSON: function() {
        return {
            "id": this.get("id"),
            "order": this.get("order"),
            "folders": this.get("folders"),
            "timestamp": this.get("timestamp")
        }
    }

});