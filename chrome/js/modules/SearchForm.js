var SearchForm = Backbone.View.extend({
    initialize: function() {
    	var wait;

    	var view = this;
    	var model = this.model;

    	$("#sidebar-search").on("keyup", function(event) {
    		clearTimeout(wait);
    		wait = setTimeout(function() {
    			var searchTerm = $("#sidebar-search").val();

    			if (searchTerm !== model.get("term")) {
    				model.set("term", searchTerm);    				    				    				
    			}
    		}, 250);
    	});

    	$("#sidebar-search-cancel").on("click", function() {
    		$("#sidebar-search").val("");

    		//TODO Trigger revert event in model
    		view.revertSidebar();
    	});
    },

    filterSidebar: function(term) {
    	var model = this.model;
    	var view = this;

    	if (term === "") {
    		view.revertSidebar();
    	}
    	else {
    		var filteredHistoryItems = pm.history.filter(term);
    		var filteredCollectionItems = pm.collections.filter(term);

    		view.toggleHistoryItemsVisibility(filteredHistoryItems);
    		view.toggleCollectionItemsVisibility(filteredCollectionItems);
    	}
    },

    revertSidebar: function() {
    	var history = this.model.get("history");
    	var collections = this.model.get("collections");
    	history.revert();
    	collections.revert();
    }
});
