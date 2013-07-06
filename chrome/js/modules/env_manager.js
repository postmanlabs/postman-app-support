var Globals = Backbone.Model.extend({
    defaults: function() {
        return {
            "globals": []
        };
    },

    initGlobals:function (callback) {
        this.set({"globals": []});
        pm.storage.getValue('globals', function(s) {
            if (s) {
                this.set({"globals": JSON.parse(s)});
            }
            else {
                this.set({"globals": []});
            }

            callback();
        });
    },

    saveGlobals:function () {
        var globals = $('#globals-keyvaleditor').keyvalueeditor('getValues');
        this.set({"globals": globals});

        var o = {'globals': JSON.stringify(globals)};

        pm.storage.setValue(o, function() {
            console.log("Set the values");

            //TODO Handle drive code later
            /*
            pm.envManager.drive.checkIfGlobalsAreOnDrive("globals", function(exists, driveFile) {
                if (exists) {
                    pm.envManager.drive.queueGlobalsUpdate(globals);
                }
                else {
                    pm.envManager.drive.queueGlobalsPost(globals);
                }
            });
            */
        });
    },

    mergeGlobals: function(globals) {
        this.set({"globals": globals});
        var o = {'globals': JSON.stringify(globals)};
        pm.storage.setValue(o, function() {
            console.log("Updated globals");
        });
    }
});

var EnvironmentSelector = Backbone.View.extend({
    initialize: function() {
        this.environments.on('change', this.render, this);

        var environments = this.environments;
        var variableProcessor = this.variableProcessor;

        $('#environment-selector').on("click", ".environment-list-item", function () {
            var id = $(this).attr('data-id');
            var selectedEnv = environments.get(id);
            variableProcessor.set({"selectedEnv": selectedEnv});
            pm.settings.setSetting("selectedEnvironmentId", selectedEnv.id);
            $('#environment-selector .environment-list-item-selected').html(selectedEnv.name);
        });

        $('#environment-selector').on("click", ".environment-list-item-noenvironment", function () {
            variableProcessor.set({"selectedEnv": null});
            pm.settings.setSetting("selectedEnvironmentId", "");
            $('#environment-selector .environment-list-item-selected').html("No environment");
        });
    },

    render: function() {
        $('#environment-selector .dropdown-menu').html("");
        $('#environments-list tbody').html("");

        $('#environment-selector .dropdown-menu').append(Handlebars.templates.environment_selector({"items":this.environments.models}));
        $('#environments-list tbody').append(Handlebars.templates.environment_list({"items":this.environments.models}));
        $('#environment-selector .dropdown-menu').append(Handlebars.templates.environment_selector_actions());

        var selectedEnv = this.variableProcessor.get("selectedEnv");

        if (selectedEnv) {
            $('#environment-selector .environment-list-item-selected').html(selectedEnv.name);
        }
        else {
            $('#environment-selector .environment-list-item-selected').html("No environment");
        }
    }
});

var EnvironmentManagerModal = Backbone.View.extend({
    initialize: function() {
        this.environments.on('change', this.render, this);
        this.globals.on('change', this.render, this);

        var environments = this.environments;
        var globals = this.globals;
        var view = this;

        $('#environment-list').append(Handlebars.templates.environment_list({"items": this.environments.get("environments")}));

        $('#environments-list').on("click", ".environment-action-delete", function () {
            var id = $(this).attr('data-id');
            $('a[rel="tooltip"]').tooltip('hide');
            environments.deleteEnvironment(id);
        });

        $('#environments-list').on("click", ".environment-action-edit", function () {
            var id = $(this).attr('data-id');
            view.showEditor(id);
        });

        $('#environments-list').on("click", ".environment-action-duplicate", function () {
            var id = $(this).attr('data-id');
            environments.duplicateEnvironment(id);
        });

        $('#environments-list').on("click", ".environment-action-download", function () {
            var id = $(this).attr('data-id');
            environments.downloadEnvironment(id);
        });

        $('.environment-action-back').on("click", function () {
            view.showSelector();
        });

        $('#environment-files-input').on('change', function (event) {
            var files = event.target.files;
            environments.importEnvironments(files);
            $('#environment-files-input').val("");
        });


        $('.environments-actions-add').on("click", function () {
            view.showEditor();
        });

        $('.environments-actions-import').on('click', function () {
            view.showImporter();
        });

        $('.environments-actions-manage-globals').on('click', function () {
            view.showGlobals();
        });

        $('.environments-actions-add-submit').on("click", function () {
            var id = $('#environment-editor-id').val();
            var name = $('#environment-editor-name').val();
            var values = $('#environment-keyvaleditor').keyvalueeditor('getValues');

            if (id === "0") {
                environments.addEnvironment(name, values);
            }
            else {
                environments.updateEnvironment(id, name, values);
            }

            $('#environment-editor-name').val("");
            $('#environment-keyvaleditor').keyvalueeditor('reset', []);

        });

        $('.environments-actions-add-back').on("click", function () {
            globals.saveGlobals();
            view.showSelector();
            $('#environment-editor-name').val("");
            $('#environment-keyvaleditor').keyvalueeditor('reset', []);
        });

        $('#environments-list-help-toggle').on("click", function (event) {
            var d = $('#environments-list-help-detail').css("display");
            if (d === "none") {
                $('#environments-list-help-detail').css("display", "inline");
                $(event.currentTarget).html("Hide");
            }
            else {
                $('#environments-list-help-detail').css("display", "none");
                $(event.currentTarget).html("Tell me more");
            }
        });

        var params = {
            placeHolderKey:"Key",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">'
        };

        $('#environment-keyvaleditor').keyvalueeditor('init', params);
        $('#globals-keyvaleditor').keyvalueeditor('init', params);
        $('#globals-keyvaleditor').keyvalueeditor('reset', this.globals.get("globals"));
    },

    showEditor:function (id) {
        if (id) {
            var environment = environments.getEnvironmentFromId(id);
            $('#environment-editor-name').val(environment.name);
            $('#environment-editor-id').val(id);
            $('#environment-keyvaleditor').keyvalueeditor('reset', environment.values);
        }
        else {
            $('#environment-editor-id').val(0);
        }

        $('#environments-list-wrapper').css("display", "none");
        $('#environment-editor').css("display", "block");
        $('#globals-editor').css("display", "none");
        $('#modal-environments .modal-footer').css("display", "block");
    },

    showSelector:function () {
        $('#environments-list-wrapper').css("display", "block");
        $('#environment-editor').css("display", "none");
        $('#environment-importer').css("display", "none");
        $('#globals-editor').css("display", "none");
        $('.environments-actions-add-submit').css("display", "inline");
        $('#modal-environments .modal-footer').css("display", "none");
    },

    showImporter:function () {
        $('#environments-list-wrapper').css("display", "none");
        $('#environment-editor').css("display", "none");
        $('#globals-editor').css("display", "none");
        $('#environment-importer').css("display", "block");
        $('.environments-actions-add-submit').css("display", "none");
        $('#modal-environments .modal-footer').css("display", "block");
    },

    showGlobals:function () {
        $('#environments-list-wrapper').css("display", "none");
        $('#environment-editor').css("display", "none");
        $('#globals-editor').css("display", "block");
        $('#environment-importer').css("display", "none");
        $('.environments-actions-add-submit').css("display", "none");
        $('#modal-environments .modal-footer').css("display", "block");
    }
});

var QuickLookPopOver = Backbone.View.extend({
    initialize: function() {
        this.environments.on('change', this.render, this);
        this.variableProcessor.on('change', this.render, this);
        this.globals.on('change', this.render, this);

        $('#environment-quicklook').on("mouseenter", function () {
            $('#environment-quicklook-content').css("display", "block");
        });

        $('#environment-quicklook').on("mouseleave", function () {
            $('#environment-quicklook-content').css("display", "none");
        });
    },

    render: function() {
        var environment = this.environment.get(this.variableProcessor.get("selectedEnv"));

        if (!environment) {
            $('#environment-quicklook-environments h6').html("No environment");
            $('#environment-quicklook-environments ul').html("");
        }
        else {
            $('#environment-quicklook-environments h6').html(environment.name);
            $('#environment-quicklook-environments ul').html("");
            $('#environment-quicklook-environments ul').append(Handlebars.templates.environment_quicklook({
                "items":environment.values
            }));
        }

        if (!this.globals) {
            return;
        }

        $('#environment-quicklook-globals ul').html("");
        $('#environment-quicklook-globals ul').append(Handlebars.templates.environment_quicklook({
            "items":this.globals
        }));
    },

    toggleDisplay:function () {
        var display = $('#environment-quicklook-content').css("display");

        if (display === "none") {
            $('#environment-quicklook-content').css("display", "block");
        }
        else {
            $('#environment-quicklook-content').css("display", "none");
        }
    }
});

var Environment = Backbone.Model.extend({
    defaults: function() {
        return {
            "id": "",
            "name": "",
            "values": [],
            "timestamp": 0
        };
    },

    addEnvironment:function (name, values) {
        var model = this;

        var environment = {
            id:guid(),
            name:name,
            values:values,
            timestamp:new Date().getTime()
        };

        pm.indexedDB.environments.addEnvironment(environment, function () {
            model.set(environment);

            //TODO: Drive syncing here
            //pm.envManager.drive.queueEnvironmentPost(environment);
        });
    },

    updateEnvironment:function () {
        var model = this;

        var environment = {
            id:id,
            name:name,
            values:values,
            timestamp:new Date().getTime()
        };

        pm.indexedDB.environments.updateEnvironment(environment, function () {
            model.set(environment);

            //TODO: Drive syncing here
            // pm.envManager.drive.queueEnvironmentUpdate(environment);
        });
    },

    deleteEnvironment:function (id) {
        var model = this;

        pm.indexedDB.environments.deleteEnvironment(id, function () {
            model.destroy();

            //TODO: Drive syncing here
            // pm.envManager.drive.queueEnvironmentDelete(id);
        });
    },

    downloadEnvironment:function (id) {
        var name = this.get("name") + ".postman_environment";
        var type = "application/json";
        var filedata = this.toJSON();
        pm.filesystem.saveAndOpenFile(name, filedata, type, function () {
            noty(
                {
                    type:'success',
                    text:'Saved environment to disk',
                    layout:'topCenter',
                    timeout:750
                });
        });
    }
});

var Environments = Backbone.Collection.extend({
    model: Environment,

    getAllEnvironments:function () {
        var environments = this;

        pm.indexedDB.environments.getAllEnvironments(function (environments) {
            environments.sort(sortAlphabetical);

            this.add(environments, {merge: true});

            //TODO Set these as model settings
            var selectedEnvId = pm.settings.getSetting("selectedEnvironmentId");
            var selectedEnv = environments.get(selectedEnvId);
        })
    },

    duplicateEnvironment:function (id) {
        var env = this.get(id);
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
        var environments = this;

        function onUpdateEnvironment(environment) {
            var envModel = new Environment(environment);
            environments.set(envModel);
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
};

var VariableProcessor = Backbone.Model.extend({
    defaults: function() {
        return {
            environments: null,
            globals: null,
            selectedEnv:null,
            selectedEnvironmentId:""
        };
    },

    containsVariable:function (string, values) {
        var variableDelimiter = pm.settings.getSetting("variableDelimiter");
        var startDelimiter = variableDelimiter.substring(0, 2);
        var endDelimiter = variableDelimiter.substring(variableDelimiter.length - 2);
        var patString = startDelimiter + "[^\r\n]*" + endDelimiter;
        var pattern = new RegExp(patString, 'g');
        var matches = string.match(pattern);
        var count = values.length;
        var variable;

        if(matches === null) {
            return false;
        }

        for(var i = 0; i < count; i++) {
            variable = startDelimiter + values[i].key + endDelimiter;
            if(_.indexOf(matches, variable) >= 0) {
                return true;
            }
        }

        return false;
    },

    processString:function (string, values) {
        var count = values.length;
        var finalString = string;
        var patString;
        var pattern;

        var variableDelimiter = pm.settings.getSetting("variableDelimiter");
        var startDelimiter = variableDelimiter.substring(0, 2);
        var endDelimiter = variableDelimiter.substring(variableDelimiter.length - 2);

        for (var i = 0; i < count; i++) {
            patString = startDelimiter + values[i].key + endDelimiter;
            pattern = new RegExp(patString, 'g');
            finalString = finalString.replace(patString, values[i].value);
        }

        var globals = this.get("globals");
        count = globals.length;
        for (i = 0; i < count; i++) {
            patString = startDelimiter + globals[i].key + endDelimiter;
            pattern = new RegExp(patString, 'g');
            finalString = finalString.replace(patString, globals[i].value);
        }

        if (this.containsVariable(finalString, values)) {
            finalString = this.processString(finalString, values);
            return finalString;
        }
        else {
            return finalString;
        }
    },

    convertString:function (string) {
        var environment = this.get("selectedEnv");
        var envValues = [];

        if (environment !== null) {
            envValues = environment.values;
        }

        return this.processString(string, envValues);
    },

    getCurrentValue: function(string) {
        var environment = this.selectedEnv;
        var envValues = [];

        if (environment !== null) {
            envValues = environment.values;
        }

        return this.processString(string, envValues);
    },
});