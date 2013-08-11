var DriveSyncLogger = Backbone.View.extend({
    initialize: function() {
    	var wait;

    	var view = this;
    	var model = this.model;

        model.on("change:logRows", this.render, this);

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
        console.log("Render log view");
    }

});
