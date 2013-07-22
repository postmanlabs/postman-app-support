var AppState = Backbone.Model.extend({
    defaults: function() {
        return {
            isModalOpen:false,
            activeModal: ""            
        };
    },

    initialize: function(options) {
    }
});