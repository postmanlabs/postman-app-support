var Environments = Backbone.Collection.extend({
    model: Environment,

    initialize:function () {
        var collection = this;

        pm.indexedDB.environments.getAllEnvironments(function (environments) {
            environments.sort(sortAlphabetical);
            collection.add(environments, {merge: true});
        })
    },

    addEnvironment:function (name, values) {
        var collection = this;

        var environment = {
            id:guid(),
            name:name,
            values:values,
            timestamp:new Date().getTime()
        };

        console.log("Added environment", environment);
        
        var envModel = new Environment(environment);
        collection.add(envModel);

        pm.indexedDB.environments.addEnvironment(environment, function () {                        

            //TODO: Drive syncing here
            //pm.envManager.drive.queueEnvironmentPost(environment);
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

            //TODO: Drive syncing here
            // pm.envManager.drive.queueEnvironmentUpdate(environment);
        });
    },

    deleteEnvironment:function (id) {
        var collection = this;

        pm.indexedDB.environments.deleteEnvironment(id, function () {
            collection.remove(id);

            //TODO: Drive syncing here
            // pm.envManager.drive.queueEnvironmentDelete(id);
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
        var env = this.get(id).toJSON();
        env.name = env.name + " " + "copy";
        env.id = guid();

        var environments = this;

        pm.indexedDB.environments.addEnvironment(env, function () {
            //New Environment Model here
            var envModel = new Environment(env);

            //Add confirmation
            environments.add(envModel);

            //TODO: Drive syncing here
            // pm.envManager.drive.queueEnvironmentPost(env);
        });
    },

    importEnvironments:function (files) {
        var environments = this;

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
                        environments.add(envModel);
                        environments.trigger("importedEnvironment", environment);                        
                        //TODO: Drive syncing here
                        // pm.envManager.drive.queueEnvironmentPost(environment);
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
        }

        for(var i = 0; i < size; i++) {
            var environment = environments[i];
            pm.indexedDB.environments.updateEnvironment(environment, onUpdateEnvironment);
        }
    },

    //TODO Fix drive code later
    drive: {
        registerHandlers: function() {
            if (pm.drive) {
                if (!pm.drive.isSyncEnabled()) {
                    return;
                }

                pm.drive.onUpdate["postman_environment"] = pm.envManager.drive.updateEnvironmentFromDrive;
                pm.drive.onPost["postman_environment"] = pm.envManager.drive.addEnvironmentFromDrive;
                pm.drive.onDelete["environment"] = pm.envManager.drive.deleteEnvironmentFromDrive;

                pm.drive.onUpdate["postman_globals"] = pm.envManager.drive.updateGlobalsFromDrive;
                pm.drive.onPost["postman_globals"] = pm.envManager.drive.addGlobalsFromDrive;
            }
        },

        checkIfEnvironmentIsOnDrive: function(id, callback) {
            pm.indexedDB.driveFiles.getDriveFile(id, function(driveFile) {
                if (driveFile) {
                    console.log("Environment found");
                    callback(true, driveFile);
                }
                else {
                    console.log("Environment not found");
                    callback(false);
                }

            });
        },

        checkIfGlobalsAreOnDrive: function(id, callback) {
            pm.indexedDB.driveFiles.getDriveFile(id, function(driveFile) {
                if (driveFile) {
                    console.log("Globals found");
                    callback(true, driveFile);
                }
                else {
                    console.log("Globals not found");
                    callback(false);
                }

            });
        },

        queueEnvironmentPost: function(environment) {
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

            var id = environment.id;
            var name = environment.name + ".postman_environment";
            var filedata = JSON.stringify(environment);

            pm.drive.queuePost(id, "environment", name, filedata, function() {
                console.log("Uploaded new environment", name);
            });
        },

        queueEnvironmentUpdate: function(environment) {
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

            var id = environment.id;
            var name = environment.name + ".postman_environment";
            var filedata = JSON.stringify(environment);

            pm.indexedDB.driveFiles.getDriveFile(id, function(driveFile) {
                pm.drive.queueUpdate(id, "environment", name, driveFile.file, filedata, function() {
                    console.log("Updated environment", environment.id);
                });
            });
        },

        queueEnvironmentDelete: function(id) {
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

            pm.envManager.drive.checkIfEnvironmentIsOnDrive(id, function(exists, driveFile) {
                if (exists) {
                    pm.drive.queueDelete(id, "environment", driveFile.file, function() {
                        console.log("Deleted environment", id);
                    });
                }
            });
        },

        queueGlobalsPost: function(globals) {
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

            var id = "globals";
            var name = "globals" + ".postman_globals";
            var filedata = JSON.stringify(globals);

            pm.drive.queuePost(id, "globals", name, filedata, function() {
                console.log("Uploaded globals", name);
            });
        },

        queueGlobalsUpdate: function(globals) {
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

            var id = "globals";
            var name = "globals" + ".postman_globals";
            var filedata = JSON.stringify(globals);

            pm.indexedDB.driveFiles.getDriveFile(id, function(driveFile) {
                pm.drive.queueUpdate(id, "globals", name, driveFile.file, filedata, function() {
                    console.log("Updated globals", name);
                });
            });
        },

        //TOOD: Make this use the chrome storage API
        updateGlobalsFromDrive: function(responseText) {
            console.log("Update global from drive", responseText);
            var globals = JSON.parse(responseText);
            pm.envManager.globals = globals;
            pm.envManager.quicklook.refreshGlobals(globals);
            localStorage['globals'] = responseText;
        },

        updateEnvironmentFromDrive: function(responseText) {
            console.log("Update environment from drive", responseText);
            var environment = JSON.parse(responseText);
            console.log(environment, responseText);
            pm.indexedDB.environments.updateEnvironment(environment, function () {
                pm.envManager.getAllEnvironments();
            });
        },


        deleteEnvironmentFromDrive: function(id) {
            console.log("Trying to delete environment", id);
            pm.indexedDB.environments.deleteEnvironment(id, function () {
                pm.envManager.getAllEnvironments();
            });

            pm.indexedDB.driveFiles.deleteDriveFile(id, function() {
            });
        },

        addEnvironmentFromDrive: function(file, responseText) {
            var environment = JSON.parse(responseText);
            console.log("Add to DB");
            pm.indexedDB.environments.addEnvironment(environment, function () {
                pm.envManager.getAllEnvironments();
            });

            var newLocalDriveFile = {
                "id": environment.id,
                "type": "environment",
                "timestamp":new Date().getTime(),
                "fileId": file.id,
                "file": file
            };

            pm.indexedDB.driveFiles.addDriveFile(newLocalDriveFile, function(e) {
                console.log("Uploaded file", newLocalDriveFile);
                var currentTime = new Date().toISOString();
                pm.settings.setSetting("lastDriveChangeTime", currentTime);
            });
        },

        addGlobalsFromDrive: function(file, responseText) {
            var globals = JSON.parse(responseText);
            console.log("Added globals to DB");

            pm.envManager.globals = globals;
            pm.envManager.quicklook.refreshGlobals(globals);
            localStorage['globals'] = responseText;

            var newLocalDriveFile = {
                "id": "globals",
                "type": "globals",
                "timestamp":new Date().getTime(),
                "fileId": file.id,
                "file": file
            };

            pm.indexedDB.driveFiles.addDriveFile(newLocalDriveFile, function(e) {
                console.log("Uploaded file", newLocalDriveFile);
                var currentTime = new Date().toISOString();
                pm.settings.setSetting("lastDriveChangeTime", currentTime);
            });
        }
    }
});
