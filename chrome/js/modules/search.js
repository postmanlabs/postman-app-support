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
			
			if (filteredHistoryItems.length === 0) {

			}
			else {
				pm.search.toggleHistoryItemVisibility(filteredHistoryItems);
			}
		}		
	},

	toggleHistoryItemVisibility: function(filteredHistoryItems) {
		console.log("Filter history items", filteredHistoryItems);
		var count = filteredHistoryItems.length;
		for(var i = 0; i < count; i++) {
			var item = filteredHistoryItems[i];
			var id = "#sidebar-request-" + item.id;

			if(item.toShow) {
				$(id).css("display", "block");
			}
			else {
				$(id).css("display", "none");
			}
		}
	},

	revertSidebar: function() {
		console.log("Reverting sidebar to original state");
		$("#history-items li").css("display", "block");
	}
};