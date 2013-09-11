var PostmanAPI = Backbone.Model.extend({
	defaults: function() {
		return {
			"web_url": pm.webUrl
		}
	},

	initialize: function() {
		console.log("This is going to be the awesome postman API!");
	},

	uploadCollection: function(collectionData, isPublic, successCallback) {
		var uploadUrl = pm.webUrl + '/collections?is_public=' + isPublic;

		if (pm.user.get("id") !== 0) {
		    uploadUrl += "&user_id=" + pm.user.get("id");
		    uploadUrl += "&access_token=" + pm.user.get("access_token");
		}

		$.ajax({
		    type:'POST',
		    url:uploadUrl,
		    data:collectionData,
		    success:function (data) {
		    	if (successCallback) {
		    		successCallback(data);
		    	}
		    }
		});
	},

	getDirectoryCollections: function(startId, count, order, successCallback) {
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
		    	if (successCallback) {
		    		successCallback(collections);
		    	}
		    }
		});
	},

	downloadDirectoryCollection: function(link_id, successCallback) {
	    var getUrl = pm.webUrl + "/collections/" + link_id;
	    getUrl += "?user_id=" + pm.user.get("id");
	    getUrl += "&access_token=" + pm.user.get("access_token");

	    $.get(getUrl, function (data) {
	    	if (successCallback) {
	    		successCallback(data);
	    	}
	    });
	},

	getUserCollections: function(successCallback) {
		var user = pm.user;

		var getUrl = pm.webUrl + "/users/" + user.get("id") + "/collections";
		getUrl += "?user_id=" + user.get("id");
		getUrl += "&access_token=" + user.get("access_token");

		$.ajax({
		    type:'GET',
		    url:getUrl,
		    success:function (data) {
		    	if (successCallback) {
		    		successCallback(data);
		    	}
		    }
		});
	},

	deleteSharedCollection: function(id, successCallback) {
		var user = pm.user;

		var deleteUrl = pm.webUrl + "/users/" + user.get("id") + "/collections/" + id;
		deleteUrl += "?user_id=" + user.get("id");
		deleteUrl += "&access_token=" + user.get("access_token");

		$.ajax({
		    type:'DELETE',
		    url:deleteUrl,
		    success:function (data) {
		    	if (successCallback) {
		    		successCallback(data);
		    	}
		    }
		});
	}
})