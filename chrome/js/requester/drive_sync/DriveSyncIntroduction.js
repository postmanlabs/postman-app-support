var DriveSyncIntroduction = Backbone.View.extend({
    initialize: function() {
        var permissionStatus = pm.settings.getSetting("driveSyncPermissionStatus");
        console.log("Permission status is ", permissionStatus);
        if (permissionStatus === "not_asked") {
            $("#modal-drive-first-time-sync").modal("show");
        }

        $("#drive-sync-backup").on("click", function() {
            pm.indexedDB.downloadAllData(function() {
                noty(
                {
                    type:'success',
                    text:'Saved the data dump',
                    layout:'topCenter',
                    timeout:750
                });
            });
        });

        $("#drive-sync-start").on("click", function() {
            pm.settings.setSetting("driveSyncPermissionStatus", "asked");
            pm.settings.setSetting("driveSyncEnabled", true);
            $("#modal-drive-first-time-sync").modal("hide");
        });

        $("#drive-sync-cancel").on("click", function() {
            pm.settings.setSetting("driveSyncPermissionStatus", "disabled");
            pm.settings.setSetting("driveSyncEnabled", false);
            $("#modal-drive-first-time-sync").modal("hide");
        });
    }
});
