var SearchState = Backbone.Model.extend({
    defaults: function() {
        return {
            term: "",            
            history: null,
            collections: null
        };
    },

    initialize: function(options) {
        this.on("change:term", this.onChangeSearchTerm, this);
    },

    onChangeSearchTerm: function() {
        this.filterSidebar(this.get("term"));
    },

    filterSidebar: function(term) {
        var history = this.get("history");
        var collections = this.get("collections");

        if (term === "") {
            history.revert();
            collections.revert();
        }
        else {
            history.filter(term);
            collections.filter(term);
        }
    } 
});