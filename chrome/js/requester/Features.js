var FEATURES = {
	USER: "user",
	DIRECTORY: "directory",
	DRIVE_SYNC: "drive_sync"
};

var Features = Backbone.Model.extend({
	defaults: function() {
		var obj = {};
		obj[FEATURES.USER] = false;
		obj[FEATURES.DIRECTORY] = false;
		obj[FEATURES.DRIVE_SYNC] = true;

	    return obj;
	},

	isFeatureEnabled: function(feature) {
		return this.get(feature);
	}
})