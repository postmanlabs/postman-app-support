var SearchForm = Backbone.View.extend({
    initialize: function() {
    	var wait;

    	var view = this;
    	var model = this.model;

    	$("#sidebar-search").on("keyup", function(event) {
            $("#sidebar-search-cancel").css("display", "block");
    		clearTimeout(wait);
    		wait = setTimeout(function() {
    			var searchTerm = $("#sidebar-search").val();

    			if (searchTerm !== model.get("term")) {
    				model.set("term", searchTerm);
    			}

                if (searchTerm === "") {
                    $("#sidebar-search-cancel").css("display", "none");
                }
    		}, 250);
    	});

    	$("#sidebar-search-cancel").on("click", function() {
    		$("#sidebar-search").val("");
    		view.revertSidebar();
    	});
    },

    revertSidebar: function() {
        $("#sidebar-search-cancel").css("display", "none");
    	var history = this.model.get("history");
    	var collections = this.model.get("collections");
    	history.revert();
    	collections.revert();
    }
});
