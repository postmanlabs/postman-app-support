var PmCollection = Backbone.Model.extend({
    defaults: function() {
        return {
            "id": "",
            "order": [],
            "requests": [],
            "timestamp": 0
        };
    }
});