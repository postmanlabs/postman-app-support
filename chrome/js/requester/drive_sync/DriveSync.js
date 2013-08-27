var DriveSync = Backbone.Model.extend({
    defaults: function() {
        return {
        	initializedSync: false,
        	lastSynced: "",
        	canSync: false,
        	isSyncing: false,
        	fileSystem: null,
        	queue: [],
            log: null
        };
    },

    initialize: function(options) {
        var model = this;

        var canSync = pm.settings.getSetting("driveSyncEnabled");

        if (canSync) {
            this.openSyncableFileSystem();
        }

        pm.mediator.on("driveSyncStatusChanged", function() {
            canSync = pm.settings.getSetting("driveSyncEnabled");

            if (canSync) {
                model.openSyncableFileSystem();
            }

        });
    },

    errorHandler:function (e) {
        var msg = '';

        switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
        case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
        case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
        case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
        default:
            msg = 'Unknown Error';
            break;
        }

        this.get("log").addToLog("DriveSync", 'Error: ' + msg);
    },

    openSyncableFileSystem: function() {
        this.get("log").addToLog("Opening Google Drive file system");

    	var model = this;

        var canSync = pm.settings.getSetting("driveSyncEnabled");

        if (!canSync) {
            this.get("log").addToLog("Can not sync");
            return false;
        }
        else {
            chrome.syncFileSystem.requestFileSystem(function (fs) {
                model.get("log").addToLog("Opened Google Drive file system");

                if (chrome.runtime.lastError) {
                    // TODO Need to handle this in a better way
                    model.errorHandler('requestFileSystem: ' + chrome.runtime.lastError.message);
                    return;
                }

                _.bind(model.onFileSystemOpened, model)(fs);
            });

            return true;
        }
    },

    isSyncingInitialized: function() {
    	return this.get("initializedSync");
    },

    onFileSystemOpened: function(fs) {
    	var model = this;

    	this.set("fileSystem", fs);
    	this.set("initializedSync", true);
    	pm.mediator.trigger("initializedSyncableFileSystem");

    	pm.mediator.on("addSyncableFile", function(syncableFile, callback) {
    		model.get("log").logChangeOnDrive("addSyncableFile", syncableFile.name);
    		model.syncFile(syncableFile, callback);
    	});

    	pm.mediator.on("updateSyncableFile", function(syncableFile, callback) {
    		model.get("log").logChangeOnDrive("updateSyncableFile", syncableFile.name);
    		model.syncFile(syncableFile, callback);
    	});

    	pm.mediator.on("removeSyncableFile", function(name, callback) {
    		model.get("log").logChangeOnDrive("removeSyncableFile", name);
    		model.removeFile(name);
    	});

    	pm.mediator.on("getSyncableFileData", function(fileEntry, callback) {
            model.get("log").logChangeOnDrive("getSyncableFileData");
    		model.getFile(fileEntry, callback);
    	});

    	this.startListeningForChanges();
    },

    removeFileIfExists:function (name, callback) {
    	var fileSystem = this.get("fileSystem");

        fileSystem.root.getFile(name, {create:false},
        	function (fileEntry) {
                fileEntry.remove(function () {
                	if (callback) {
                		callback();
                	}

                }, function () {
                	if (callback) {
                		callback();
                	}

                });
            },
            function () {
            	if (callback) {
            		callback();
            	}
        	}
    	);
    },

    // Add/edit file
    syncFile: function(syncableFile, callback) {

    	var fileSystem = this.get("fileSystem");
    	var name = syncableFile.name;
    	var data = syncableFile.data;
    	var errorHandler = this.errorHandler;

    	fileSystem.root.getFile(name,
    	    {create:true},
    	    function (fileEntry) {
    	        if (!fileEntry) {
                    return;
                }

                fileEntry.createWriter(function(writer) {
                    var truncated = false;

                    writer.onerror = function (e) {
                    	if (callback) {
                    		callback("failed");
                    	}
                    };

                    writer.onwriteend = function(e) {
                        if (!truncated) {
                            truncated = true;
                            this.truncate(this.position);
                            return;
                        }

                        if (callback) {
                        	callback("success");
                        }

                    };

                    blob = new Blob([data], {type:'text/plain'});

                    writer.write(blob);
                }, errorHandler);
    	    }, errorHandler
    	);
    },

    getFile: function(fileEntry, callback) {

    	var errorHandler = this.errorHandler;

    	fileEntry.file(function(file) {

			var reader = new FileReader();
			reader.readAsText(file, "utf-8");

			reader.onload = function(ev) {
				if (callback) {
					callback(ev.target.result);
				}
			};
    	}, errorHandler);
    },

    // Remove file
    removeFile: function(name, callback) {
    	this.removeFileIfExists(name, callback);
    },

    startListeningForChanges: function() {
    	var model = this;

    	chrome.syncFileSystem.onFileStatusChanged.addListener(
			function(detail) {
				_.bind(model.onSyncableFileStatusChanged, model)(detail);
			}
		);
    },

    onSyncableFileStatusChanged: function(detail) {
        var model = this;

    	var direction = detail.direction;
    	var action = detail.action;
    	var name = detail.fileEntry.name;
    	var status = detail.status;
    	var s = splitSyncableFilename(name);

    	var id = s.id;
    	var type = s.type;

    	if (status === "synced") {
    	    if (direction === "remote_to_local") {
    	        if (action === "added") {
    	            model.get("log").logFileStatusChange("Add file", name);
    	            this.getFile(detail.fileEntry, function(data) {
    	            	pm.mediator.trigger("addSyncableFileFromRemote", type, data);
    	            });
    	        }
    	        else if (action === "updated") {
    	        	model.get("log").logFileStatusChange("Update file", name);
    	        	this.getFile(detail.fileEntry, function(data) {
    	        		pm.mediator.trigger("updateSyncableFileFromRemote", type, data);
    	        	});
    	        }
    	        else if (action === "deleted") {
    	            model.get("log").logFileStatusChange("Delete file", name);
    	            pm.mediator.trigger("deleteSyncableFileFromRemote", type, id);
    	        }
    	    }
    	    else {
                model.get("log").logFileStatusChange("local_to_remote", name);
    	    }
    	}
    	else {
            model.get("log").logFileStatusChange("Not synced", name);
    	}
    }
});