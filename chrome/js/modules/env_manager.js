pm.envManager = {
    environments:[],

    globals:{},
    selectedEnv:null,
    selectedEnvironmentId:"",

    quicklook:{
        init:function () {
            pm.envManager.quicklook.refreshEnvironment(pm.envManager.selectedEnv);
            pm.envManager.quicklook.refreshGlobals(pm.envManager.globals);
        },

        removeEnvironmentData:function () {
            $('#environment-quicklook-environments h6').html("No environment");
            $('#environment-quicklook-environments ul').html("");
        },

        refreshEnvironment:function (environment) {
            if (!environment) {
                return;
            }
            $('#environment-quicklook-environments h6').html(environment.name);
            $('#environment-quicklook-environments ul').html("");
            $('#environment-quicklook-environments ul').append(Handlebars.templates.environment_quicklook({
                "items":environment.values
            }));
        },

        refreshGlobals:function (globals) {
            if (!globals) {
                return;
            }

            $('#environment-quicklook-globals ul').html("");
            $('#environment-quicklook-globals ul').append(Handlebars.templates.environment_quicklook({
                "items":globals
            }));
        },

        toggleDisplay:function () {
            var display = $('#environment-quicklook-content').css("display");

            if (display == "none") {
                $('#environment-quicklook-content').css("display", "block");
            }
            else {
                $('#environment-quicklook-content').css("display", "none");
            }
        }
    },

    init:function () {
        pm.envManager.initGlobals();
        $('#environment-list').append(Handlebars.templates.environment_list({"items":this.environments}));

        $('#environments-list').on("click", ".environment-action-delete", function () {
            var id = $(this).attr('data-id');
            $('a[rel="tooltip"]').tooltip('hide');
            pm.envManager.deleteEnvironment(id);
        });

        $('#environments-list').on("click", ".environment-action-edit", function () {
            var id = $(this).attr('data-id');
            pm.envManager.showEditor(id);
        });

        $('#environments-list').on("click", ".environment-action-duplicate", function () {
            var id = $(this).attr('data-id');
            pm.envManager.duplicateEnvironment(id);
        });

        $('#environments-list').on("click", ".environment-action-download", function () {
            var id = $(this).attr('data-id');
            pm.envManager.downloadEnvironment(id);
        });

        $('.environment-action-back').on("click", function () {
            pm.envManager.showSelector();
        });

        $('#environment-selector').on("click", ".environment-list-item", function () {
            var id = $(this).attr('data-id');
            var selectedEnv = pm.envManager.getEnvironmentFromId(id);
            pm.envManager.selectedEnv = selectedEnv;
            pm.settings.set("selectedEnvironmentId", selectedEnv.id);
            pm.envManager.quicklook.refreshEnvironment(selectedEnv);
            $('#environment-selector .environment-list-item-selected').html(selectedEnv.name);
        });

        $('#environment-selector').on("click", ".environment-list-item-noenvironment", function () {
            pm.envManager.selectedEnv = null;
            pm.settings.set("selectedEnvironmentId", "");
            pm.envManager.quicklook.removeEnvironmentData();
            $('#environment-selector .environment-list-item-selected').html("No environment");
        });

        $('#environment-quicklook').on("mouseenter", function () {
            $('#environment-quicklook-content').css("display", "block");
        });

        $('#environment-quicklook').on("mouseleave", function () {
            $('#environment-quicklook-content').css("display", "none");
        });

        $('#environment-files-input').on('change', function (event) {
            var files = event.target.files;
            pm.envManager.importEnvironments(files);
            $('#environment-files-input').val("");
        });


        $('.environments-actions-add').on("click", function () {
            pm.envManager.showEditor();
        });

        $('.environments-actions-import').on('click', function () {
            pm.envManager.showImporter();
        });

        $('.environments-actions-manage-globals').on('click', function () {
            pm.envManager.showGlobals();
        });

        $('.environments-actions-add-submit').on("click", function () {
            var id = $('#environment-editor-id').val();
            if (id === "0") {
                pm.envManager.addEnvironment();
            }
            else {
                pm.envManager.updateEnvironment();
            }

            $('#environment-editor-name').val("");
            $('#environment-keyvaleditor').keyvalueeditor('reset', []);

        });

        $('.environments-actions-add-back').on("click", function () {
            pm.envManager.saveGlobals();
            pm.envManager.showSelector();
            $('#environment-editor-name').val("");
            $('#environment-keyvaleditor').keyvalueeditor('reset', []);
        });

        $('#environments-list-help-toggle').on("click", function () {
            var d = $('#environments-list-help-detail').css("display");
            if (d === "none") {
                $('#environments-list-help-detail').css("display", "inline");
                $(this).html("Hide");
            }
            else {
                $('#environments-list-help-detail').css("display", "none");
                $(this).html("Tell me more");
            }
        });

        var params = {
            placeHolderKey:"Key",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">'
        };

        $('#environment-keyvaleditor').keyvalueeditor('init', params);
        $('#globals-keyvaleditor').keyvalueeditor('init', params);
        $('#globals-keyvaleditor').keyvalueeditor('reset', pm.envManager.globals);
        pm.envManager.quicklook.init();
    },

    getEnvironmentFromId:function (id) {
        var environments = pm.envManager.environments;
        var count = environments.length;
        for (var i = 0; i < count; i++) {
            var env = environments[i];
            if (id === env.id) {
                return env;
            }
        }

        return false;
    },

    containsVariable:function (string, values) {
        var variableDelimiter = pm.settings.get("variableDelimiter");
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

        var variableDelimiter = pm.settings.get("variableDelimiter");
        var startDelimiter = variableDelimiter.substring(0, 2);
        var endDelimiter = variableDelimiter.substring(variableDelimiter.length - 2);

        for (var i = 0; i < count; i++) {
            patString = startDelimiter + values[i].key + endDelimiter;
            pattern = new RegExp(patString, 'g');
            finalString = finalString.replace(patString, values[i].value);
        }

        var globals = pm.envManager.globals;
        count = globals.length;
        for (i = 0; i < count; i++) {
            patString = startDelimiter + globals[i].key + endDelimiter;
            pattern = new RegExp(patString, 'g');
            finalString = finalString.replace(patString, globals[i].value);
        }

        if (pm.envManager.containsVariable(finalString, values)) {
            finalString = pm.envManager.processString(finalString, values);
            return finalString;
        }
        else {
            return finalString;
        }
    },

    convertString:function (string) {
        var environment = pm.envManager.selectedEnv;
        var envValues = [];

        if (environment !== null) {
            envValues = environment.values;
        }

        return pm.envManager.processString(string, envValues);
    },

    getCurrentValue: function(string) {
        var environment = pm.envManager.selectedEnv;
        var envValues = [];

        if (environment !== null) {
            envValues = environment.values;
        }

        return pm.envManager.processString(string, envValues);
    },

    getAllEnvironments:function () {
        pm.indexedDB.environments.getAllEnvironments(function (environments) {
            environments.sort(sortAlphabetical);            
            
            $('#environment-selector .dropdown-menu').html("");
            $('#environments-list tbody').html("");
            pm.envManager.environments = environments;


            $('#environment-selector .dropdown-menu').append(Handlebars.templates.environment_selector({"items":environments}));
            $('#environments-list tbody').append(Handlebars.templates.environment_list({"items":environments}));
            $('#environment-selector .dropdown-menu').append(Handlebars.templates.environment_selector_actions());

            var selectedEnvId = pm.settings.get("selectedEnvironmentId");
            var selectedEnv = pm.envManager.getEnvironmentFromId(selectedEnvId);
            if (selectedEnv) {
                pm.envManager.selectedEnv = selectedEnv;
                pm.envManager.quicklook.refreshEnvironment(selectedEnv);
                $('#environment-selector .environment-list-item-selected').html(selectedEnv.name);
            }
            else {
                pm.envManager.selectedEnv = null;
                $('#environment-selector .environment-list-item-selected').html("No environment");
            }
        })
    },

    initGlobals:function () {
        if ('globals' in localStorage) {
            var globalsString = localStorage['globals'];
            pm.envManager.globals = JSON.parse(globalsString);
        }
        else {
            pm.envManager.globals = [];
        }

    },

    saveGlobals:function () {
        var globals = $('#globals-keyvaleditor').keyvalueeditor('getValues');
        pm.envManager.globals = globals;
        pm.envManager.quicklook.refreshGlobals(globals);
        localStorage['globals'] = JSON.stringify(globals);
    },

    showSelector:function () {
        $('#environments-list-wrapper').css("display", "block");
        $('#environment-editor').css("display", "none");
        $('#environment-importer').css("display", "none");
        $('#globals-editor').css("display", "none");
        $('.environments-actions-add-submit').css("display", "inline");
        $('#modal-environments .modal-footer').css("display", "none");
    },

    showEditor:function (id) {
        if (id) {
            var environment = pm.envManager.getEnvironmentFromId(id);
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
    },

    addEnvironment:function () {
        var name = $('#environment-editor-name').val();
        var values = $('#environment-keyvaleditor').keyvalueeditor('getValues');
        var environment = {
            id:guid(),
            name:name,
            values:values,
            timestamp:new Date().getTime()
        };

        pm.indexedDB.environments.addEnvironment(environment, function () {
            pm.envManager.getAllEnvironments();
            pm.envManager.showSelector();
        });
    },

    updateEnvironment:function () {
        var id = $('#environment-editor-id').val();
        var name = $('#environment-editor-name').val();
        var values = $('#environment-keyvaleditor').keyvalueeditor('getValues');
        var environment = {
            id:id,
            name:name,
            values:values,
            timestamp:new Date().getTime()
        };

        pm.indexedDB.environments.updateEnvironment(environment, function () {
            pm.envManager.getAllEnvironments();
            pm.envManager.showSelector();
        });
    },

    deleteEnvironment:function (id) {
        pm.indexedDB.environments.deleteEnvironment(id, function () {
            pm.envManager.getAllEnvironments();
            pm.envManager.showSelector();
        });
    },

    duplicateEnvironment:function (id) {
        var env = pm.envManager.getEnvironmentFromId(id);
        
        //get a new name for this duplicated environment
        env.name = env.name + " " + "copy";
        
        //change the env guid
        env.id = guid();

        pm.indexedDB.environments.addEnvironment(env, function () {
            //Add confirmation
            var o = {
                name:env.name,
                action:'added'
            };

            pm.envManager.getAllEnvironments();
        });        
    },

    downloadEnvironment:function (id) {
        var env = pm.envManager.getEnvironmentFromId(id);
        var name = env.name + "-environment.json";
        var type = "application/json";
        var filedata = JSON.stringify(env);
        pm.filesystem.saveAndOpenFile(name, filedata, type, function () {
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
                        //Add confirmation
                        var o = {
                            name:environment.name,
                            action:'added'
                        };

                        $('#environment-importer-confirmations').append(Handlebars.templates.message_environment_added(o));
                        pm.envManager.getAllEnvironments();
                    });
                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsText(f);
        }
    }

};