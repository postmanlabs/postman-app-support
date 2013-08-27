var DriveSyncLogger = Backbone.View.extend({
    initialize: function() {
    	var wait;

    	var view = this;
        this.model.on("add", this.render, this);

        $("#google-drive-toggle").on("click", function() {
            view.toggleGoogleDriveSync();
        });

        $("#google-drive-status a").on("click", function() {
            view.toggleLoggerDisplay();
        });

        $("#google-drive-close-logger").on("click", function() {
            view.toggleLoggerDisplay();
        });

        $(document).bind('keydown', 'alt+g', function () {
            view.toggleLoggerDisplay();
        });

        var canSync = pm.settings.getSetting("driveSyncEnabled");

        if(canSync) {
            $("#logger-drivesync-log-empty-view").css("display", "none");
            $("#logger-drivesync-log-container").css("display", "block");
            $("#google-drive-toggle").html("Disable syncing with Google Drive");
            $("#google-drive-toggle").addClass("btn btn-danger");
        }
        else {
            $("#logger-drivesync-log-empty-view").css("display", "block");
            $("#logger-drivesync-log-container").css("display", "none");
            $("#google-drive-toggle").html("Enable syncing with Google Drive");
            $("#google-drive-toggle").addClass("btn btn-primary");
        }
    },

    toggleGoogleDriveSync: function() {
        var canSync = pm.settings.getSetting("driveSyncEnabled");

        if(canSync) {
            pm.settings.setSetting("driveSyncEnabled", false);
            $("#google-drive-toggle").html("Enable syncing with Google Drive");
            $("#logger-drivesync-log-empty-view").css("display", "block");
            $("#logger-drivesync-log-container").css("display", "none");
            $("#google-drive-toggle").removeClass();
            $("#google-drive-toggle").addClass("btn btn-primary");
            $("#google-drive-toggle").html("Enable syncing with Google Drive");

            pm.mediator.trigger("driveSyncStatusChanged");
        }
        else {
            pm.settings.setSetting("driveSyncEnabled", true);

            $("#logger-drivesync-log-empty-view").css("display", "none");
            $("#logger-drivesync-log-container").css("display", "block");

            $("#google-drive-toggle").html("Disable syncing with Google Drive");
            $("#google-drive-toggle").removeClass();
            $("#google-drive-toggle").addClass("btn btn-danger");

            pm.mediator.trigger("driveSyncStatusChanged");
        }
    },

    toggleLoggerDisplay: function() {
        var displayed = $("#logger-drivesync").css("display") === "block";

        if (displayed) {
            $("#logger-drivesync").css("display", "none");
        }
        else {
            $("#logger-drivesync").css("display", "block");
        }
    },

    render: function() {
        var logItems = this.model.toJSON();
        $('#logger-drivesync-items').html("");
        $('#logger-drivesync-items').append(Handlebars.templates.logger_drivesync({items: logItems}));
        $('#logger-drivesync-log-container').scrollTop($('#logger-drivesync-items').height());
    }

});
