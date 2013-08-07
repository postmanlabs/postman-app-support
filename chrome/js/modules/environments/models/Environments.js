var Environments = Backbone.Collection.extend({
    model: Environment,

    isLoaded: false,
    initializedSyncing: false,

    initialize:function () {
        var collection = this;
        
        this.startListeningForFileSystemSyncEvents();

        pm.indexedDB.environments.getAllEnvironments(function (environments) {
            collection.set("loaded", true);
            environments.sort(sortAlphabetical);
            collection.add(environments, {merge: true});    
            console.log("Received environments");            
            collection.isLoaded = true;
            collection.trigger("startSync");
        })
    },

    startListeningForFileSystemSyncEvents: function() {
        var collection = this;
        var isLoaded = collection.isLoaded;
        var initializedSyncing = collection.initializedSyncing;

        console.log("Environments startListeningForFileSystemSyncEvents");

        pm.mediator.on("initializedSyncableFileSystem", function() {
            collection.initializedSyncing = true;
            collection.trigger("startSync");
        });

        this.on("startSync", this.startSyncingEnvironments, this);
    },

    startSyncingEnvironments: function() {        
        var i = 0;
        var collection = this;
        var environment;
        var synced;
        var syncableFile;

        console.log("Start syncing environments");

        if (this.isLoaded && this.initializedSyncing) {
            console.log("Have environments. Can sync", this.toJSON());

            pm.mediator.on("syncableFileStatusChanged", function(detail) {
                console.log("File status changed", detail);                
                var direction = detail.direction;
                var action = detail.action;
                var name = detail.fileEntry.name;
                var status = detail.status;
                var s = splitSyncableFilename(name);

                var id = s.id;
                var type = s.type;

                if (type === "environment") {
                    if (status === "synced") {
                        if (direction === "remote_to_local") {
                            if (action === "added") {
                                console.log("Add local file to environment", id);
                            }
                            else if (action === "updated") {
                                console.log("Update local environment", id);
                            }
                            else if (action === "deleted") {
                                console.log("Delete local environment", id);
                            }
                        }
                        else {
                            console.log("direction was local_to_remote");
                        }
                    }
                    else {
                        console.log("Not synced");
                    }                    
                }                
                else {
                    console.log("Not environment");
                }
            });

            for(i = 0; i < this.models.length; i++) {
                environment = this.models[i];
                synced = environment.get("synced");

                if (synced) {
                    console.log("No need to sync", environment);                    
                }
                else {
                    console.log("Sync", this.getAsSyncFile(environment.get("id")));
                    this.addToSyncableFilesystem(environment.get("id"));                    
                }
            }
        }
        else {
            // Wait for event to be called
        }
    },

    getAsSyncableFile: function(id) {
        var environment = this.get(id);
        var name = id + ".environment";
        var type = "environment";
        var data = JSON.stringify(environment.toJSON());

        return {
            "name": name,
            "type": type,
            "data": data
        };
    },

    addToSyncableFilesystem: function(id) {
        var collection = this;

        var syncableFile = this.getAsSyncableFile(id);
        pm.mediator.trigger("addSyncableFile", syncableFile, function(result) {
            if(result === "success") {
                collection.updateEnvironmentSyncStatus(id, true);        
            }
        });
    },

    removeFromSyncableFilesystem: function(id) {
        var name = id + ".environment";
        pm.mediator.trigger("removeSyncableFile", name, function(result) {
            console.log("Removed file");
        });
    },

    addEnvironment:function (name, values) {
        var collection = this;

        var environment = {
            id:guid(),
            name:name,
            values:values,
            timestamp:new Date().getTime(),
            synced: false            
        };

        console.log("Added environment", environment);
        
        var envModel = new Environment(environment);
        collection.add(envModel);

        pm.indexedDB.environments.addEnvironment(environment, function () {
            collection.addToSyncableFilesystem(environment.id);
        });
    },

    updateEnvironment:function (id, name, values) {
        var collection = this;

        var environment = {
            id:id,
            name:name,
            values:values,
            timestamp:new Date().getTime()
        };

        pm.indexedDB.environments.updateEnvironment(environment, function () {
            var envModel = new Environment(environment);
            collection.add(envModel, {merge: true});
            collection.addToSyncableFilesystem(environment.id);
        });
    },

    updateEnvironmentSyncStatus: function(id, status) {
        var collection = this;

        var environment = this.get(id);
        environment.set("synced", status);
        collection.add(environment, {merge: true});

        pm.indexedDB.environments.updateEnvironment(environment.toJSON(), function () {            
            console.log("Updated environment");
        });
    },

    deleteEnvironment:function (id) {
        var collection = this;

        pm.indexedDB.environments.deleteEnvironment(id, function () {
            collection.remove(id);
            collection.removeFromSyncableFilesystem(id);
        });
    },

    downloadEnvironment:function (id) {
        var environment = this.get(id);

        var name = environment.get("name") + ".postman_environment";
        var type = "application/json";
        var filedata = JSON.stringify(environment.toJSON());
        pm.filesystem.saveAndOpenFile(name, filedata, type, function () {
            noty(
                {
                    type:'success',
                    text:'Saved environment to disk',
                    layout:'topCenter',
                    timeout:750
                });
        });
    },

    duplicateEnvironment:function (id) {
        var environment = this.get(id).toJSON();
        environment.name = environment.name + " " + "copy";
        environment.id = guid();

        var collection = this;

        pm.indexedDB.environments.addEnvironment(environment, function () {            
            var envModel = new Environment(environment);
            collection.add(envModel);
            collection.addToSyncableFilesystem(environment.id);
        });
    },

    importEnvironments:function (files) {
        var collection = this;

        // Loop through the FileList
        for (var i = 0, f; f = files[i]; i++) {
            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function (theFile) {
                return function (e) {
                    // Render thumbnail.
                    var data = e.currentTarget.result;
                    var environment = JSON.parse(data);

                    pm.indexedDB.environments.addEnvironment(environment, function () {                        
                        var envModel = new Environment(environment);
                        collection.add(envModel);
                        collection.trigger("importedEnvironment", environment);

                        collection.addToSyncableFilesystem(environment.id);                 
                    });
                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsText(f);
        }
    },

    mergeEnvironments: function(environments) {
        var size = environments.length;
        var collection = this;

        function onUpdateEnvironment(environment) {
            var envModel = new Environment(environment);
            collection.set(envModel);

            collection.addToSyncableFilesystem(environment.id);
        }

        for(var i = 0; i < size; i++) {
            var environment = environments[i];
            pm.indexedDB.environments.updateEnvironment(environment, onUpdateEnvironment);
        }
    }
});
