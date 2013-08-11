var DriveSyncLogItem = Backbone.Model.extend({
    defaults: function() {
        return {
            "class": "",
            "time": 0,
            "message": ""
        };
    }
});
