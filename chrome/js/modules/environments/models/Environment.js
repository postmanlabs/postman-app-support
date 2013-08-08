var Environment = Backbone.Model.extend({
    defaults: function() {
        return {
            "id": "",
            "name": "",
            "values": [],
            "timestamp": 0,
            "synced": false,
            "syncedFilename": ""
        };
    },

    toSyncableJSON: function() {
        var j = this.toJSON();
        j.synced = true;
        return j;
    }
});
