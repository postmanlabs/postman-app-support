var Globals = Backbone.Model.extend({
    defaults: function() {
        return {
            "globals": []
        };
    },

    initialize:function () {
        this.set({"globals": []});

        var model = this;

        pm.storage.getValue('globals', function(s) {
            if (s) {
                model.set({"globals": JSON.parse(s)});
            }
            else {
                model.set({"globals": []});
            }
        });
    },

    saveGlobals:function () {
        var globals = $('#globals-keyvaleditor').keyvalueeditor('getValues');
        this.set({"globals": globals});

        var o = {'globals': JSON.stringify(globals)};

        pm.storage.setValue(o, function() {
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
        });
    }
});
