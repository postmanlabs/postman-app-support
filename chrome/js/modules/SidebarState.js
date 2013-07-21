var SidebarState = Backbone.Model.extend({
    defaults: function() {
        return {
            currentSection:"history",
            isSidebarMaximized:true,
            sections:[ "history", "collections" ],
            width:0,
            animationDuration:250,
            history:null,
            collections:null
        };
    },

    initialize: function(options) {
    }
});