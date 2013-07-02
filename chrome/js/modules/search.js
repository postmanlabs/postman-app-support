pm.search = {
	term: "",

	init: function() {
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

		$("#sidebar-search-cancel").on("click", function() {
			$("#sidebar-search").val("");
			pm.search.revertSidebar();
		});
	},

	filterSidebar: function(term) {
		if (term === "") {
			pm.search.revertSidebar();
		}
		else {
			var filteredHistoryItems = pm.history.filter(term);
			var filteredCollectionItems = pm.collections.filter(term);
			pm.search.toggleHistoryItemsVisibility(filteredHistoryItems);
			pm.search.toggleCollectionItemsVisibility(filteredCollectionItems);
		}
	},

	toggleHistoryItemsVisibility: function(filteredHistoryItems) {
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

		pm.layout.refreshScrollPanes();
	},

	toggleCollectionItemsVisibility: function(filteredCollectionItems) {
		console.log("Filtered items = ", filteredCollectionItems);
		var collectionsCount = filteredCollectionItems.length;
		for(var i = 0; i < collectionsCount; i++) {
			var c = filteredCollectionItems[i];
			var collectionDomId = "#collection-" + c.id;
			var collectionRequestsDomId = "#collection-requests-" + c.id;
			var dtDomId = "#collection-" + c.id + " .sidebar-collection-head-dt";

			if(c.toShow) {
				$(collectionDomId).css("display", "block");
				$(collectionRequestsDomId).css("display", "block");
				$(dtDomId).removeClass("disclosure-triangle-close");
				$(dtDomId).addClass("disclosure-triangle-open");

				var requests = c.requests;
				if(requests) {
					var requestsCount = requests.length;
					for(var j = 0; j < requestsCount; j++) {
						var r = requests[j];
						var requestDomId = "#sidebar-request-" + r.id;
						if(r.toShow) {
							$(requestDomId).css("display", "block");
						}
						else {
							$(requestDomId).css("display", "none");
						}
					}
				}
			}
			else {
				$(collectionDomId).css("display", "none");
				$(collectionRequestsDomId).css("display", "none");
				$(dtDomId).removeClass("disclosure-triangle-open");
				$(dtDomId).addClass("disclosure-triangle-close");
			}
		}

		pm.layout.refreshScrollPanes();
	},

	revertSidebar: function() {
		$("#history-items li").css("display", "block");
		$(".sidebar-collection").css("display", "block");
		$(".sidebar-collection-request").css("display", "block");
		pm.layout.refreshScrollPanes();
	}
};