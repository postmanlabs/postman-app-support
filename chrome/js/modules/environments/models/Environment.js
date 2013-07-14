var Environment = Backbone.Model.extend({
    defaults: function() {
        return {
            "id": "",
            "name": "",
            "values": [],
            "timestamp": 0
        };
    }
});
