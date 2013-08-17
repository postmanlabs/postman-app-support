var Environments = Backbone.Collection.extend({
    model: Environment,

    isLoaded: false,
    initializedSyncing: false,

    comparator: function(a, b) {
        var counter;

        var aName = a.get("name");
        var bName = b.get("name");

        if (aName.length > bName.legnth)
            counter = bName.length;
        else
            counter = aName.length;

        for (var i = 0; i < counter; i++) {
            if (aName[i] == bName[i]) {
                continue;
            } else if (aName[i] > bName[i]) {
                return 1;
            } else {
                return -1;
            }
        }
        return 1;
    },

    initialize:function () {
        var collection = this;

        this.startListeningForFileSystemSyncEvents();

        pm.indexedDB.environments.getAllEnvironments(function (environments) {

            environments.sort(sortAlphabetical);
            collection.add(environments, {merge: true});

            collection.isLoaded = true;
            collection.trigger("startSync");
        })
    },

    startListeningForFileSystemSyncEvents: function() {
        var collection = this;
        var isLoaded = collection.isLoaded;
        var initializedSyncing = collection.initializedSyncing;

        pm.mediator.on("initializedSyncableFileSystem", function() {
            collection.initializedSyncing = true;
            collection.trigger("startSync");
        });

        this.on("startSync", this.startSyncing, this);
    },

    startSyncing: function() {
        var i = 0;
        var collection = this;
        var environment;
        var synced;
        var syncableFile;

        if (this.isLoaded && this.initializedSyncing) {
            pm.mediator.on("addSyncableFileFromRemote", function(type, data) {
                if (type === "environment") {
                    collection.onReceivingSyncableFileData(data);
                }
            });

            pm.mediator.on("updateSyncableFileFromRemote", function(type, data) {
                if (type === "environment") {
                    collection.onReceivingSyncableFileData(data);
                }
            });

            pm.mediator.on("deleteSyncableFileFromRemote", function(type, id) {
                if (type === "environment") {
                    collection.onRemoveSyncableFile(id);
                }
            });

            // And this
            for(i = 0; i < this.models.length; i++) {
                environment = this.models[i];
                synced = environment.get("synced");

                if (!synced) {
                    this.addToSyncableFilesystem(environment.get("id"));
                }
            }
        }
        else {
        }
    },

    onReceivingSyncableFileData: function(data) {
        this.importEnvironment(data, true);
    },

    onRemoveSyncableFile: function(id) {
        this.deleteEnvironment(id, true);
    },

    getAsSyncableFile: function(id) {
        var environment = this.get(id);
        var name = id + ".environment";
        var type = "environment";
        var data = JSON.stringify(environment.toSyncableJSON());

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
        });
    },

    addEnvironment:function (name, values, doNotSync) {
        var collection = this;

        var environment = {
            id:guid(),
            name:name,
            values:values,
            timestamp:new Date().getTime(),
            synced: false
        };

        var envModel = new Environment(environment);
        collection.add(envModel);

        pm.indexedDB.environments.addEnvironment(environment, function () {
            if (doNotSync) {
                console.log("Do not sync this change");
            }
            else {
                collection.addToSyncableFilesystem(environment.id);
            }

        });
    },

    updateEnvironment:function (id, name, values, doNotSync) {
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

            if (doNotSync) {
                console.log("Do not sync this change");
            }
            else {
                collection.addToSyncableFilesystem(environment.id);
            }
        });
    },

    updateEnvironmentSyncStatus: function(id, status) {
        var collection = this;

        var environment = this.get(id);
        environment.set("synced", status);
        collection.add(environment, {merge: true});

        pm.indexedDB.environments.updateEnvironment(environment.toJSON(), function () {
        });
    },

    deleteEnvironment:function (id, doNotSync) {
        var collection = this;

        pm.indexedDB.environments.deleteEnvironment(id, function () {
            collection.remove(id);

            if (doNotSync) {
                console.log("Do not sync this");
            }
            else {
                collection.removeFromSyncableFilesystem(id);
            }
        });
    },

    downloadEnvironment:function (id) {
        var environment = this.get(id);

        environment.set("synced", false);

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

    importEnvironment: function(data, doNotSync) {
        var collection = this;

        var environment = JSON.parse(data);

        pm.indexedDB.environments.addEnvironment(environment, function () {
            var envModel = new Environment(environment);
            collection.add(envModel, {merge: true});

            if (doNotSync) {
                console.log("Do not sync this");
            }
            else {
                collection.trigger("importedEnvironment", environment);
                collection.addToSyncableFilesystem(environment.id);
            }

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
                    collection.importEnvironment(e.currentTarget.result);
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
            collection.add(envModel, {merge: true});

            collection.addToSyncableFilesystem(environment.id);
        }

        for(var i = 0; i < size; i++) {
            var environment = environments[i];
            pm.indexedDB.environments.updateEnvironment(environment, onUpdateEnvironment);
        }
    }
});
