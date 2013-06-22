pm.search = {
	term: "",

	init: function() {
		console.log("Initializing search");
		var wait;
		$("#sidebar-search").on("keyup", function(event) {			
			clearTimeout(wait);
			wait = setTimeout(function() {
				var searchTerm = $("#sidebar-search").val();

				if (searchTerm !== pm.search.term) {
					pm.search.term = searchTerm;	
					pm.search.filterSidebar(searchTerm);
				}					
			}, 250);
			
		});
	},

	filterSidebar: function(term) {
		if (term === "") {
			pm.search.revertSidebar();
		}
		else {
			var filteredHistoryItems = pm.history.filter(term);
			console.log(filteredHistoryItems);
		}		
	},

	revertSidebar: function() {
		console.log("Reverting sidebar to original state");
	}
};