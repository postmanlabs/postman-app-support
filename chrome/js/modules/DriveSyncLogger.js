var DriveSyncLogger = Backbone.View.extend({
    initialize: function() {
    	var wait;

    	var view = this;
        this.model.on("add", this.render, this);

        $(document).bind('keydown', 'alt+g', function () {
            if(pm.app.isModalOpen()) {
                return;
            }

            view.toggleLoggerDisplay();
        });
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
        console.log("Change called for logItems");

        var logItems = this.model.toJSON();
        console.log("LogItems = ", logItems);
        $('#logger-drivesync-items').html("");
        $('#logger-drivesync-items').append(Handlebars.templates.logger_drivesync({items: logItems}));
    }

});
