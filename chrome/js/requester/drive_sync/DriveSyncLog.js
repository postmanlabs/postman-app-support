var DriveSyncLog = Backbone.Collection.extend({
	model: DriveSyncLogItem,

	initialize: function() {
		console.log("Initialized DriveSyncLog");
	},

	addToLog: function(message) {
	    var obj = new DriveSyncLogItem({
	    	class: "default",
	        time: new Date().toUTCString(),
	        message: message
	    });

	    this.add(obj);
	},

	logChangeOnDrive: function(event, filename) {
		var obj = new DriveSyncLogItem({
			class: "change-on-drive",
		    time: new Date().toUTCString(),
		    message: "Local DB to Google Drive: " + event + ", " + filename
		});

		this.add(obj);
	},

	logFileStatusChange: function(event, filename) {
		var obj = new DriveSyncLogItem({
			class: "file-status-change",
		    time: new Date().toUTCString(),
		    message: "Google Drive to local DB: " + event + ", " + filename
		});

		this.add(obj);
	}
});
