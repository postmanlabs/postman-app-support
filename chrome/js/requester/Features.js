var FEATURES = {
	USER: "user",
	DIRECTORY: "directory",
	DRIVE_SYNC: "drive_sync"
};

var Features = Backbone.Model.extend({
	defaults: function() {
		var obj = {};
		obj[FEATURES.USER] = true;
		obj[FEATURES.DIRECTORY] = true;
		obj[FEATURES.DRIVE_SYNC] = false;

	    return obj;
	},

	isFeatureEnabled: function(feature) {
		return this.get(feature);
	}
})