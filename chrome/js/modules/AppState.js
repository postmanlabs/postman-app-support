var AppState = Backbone.Model.extend({
    defaults: function() {
        return {
        	variableProcessor:null,
            isModalOpen:false,
            activeModal: ""            
        };
    },

    initialize: function(options) {
    }
});