var DirectoryCollectionViewer = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;

        $("#directory-collection-viewer-download").on("click", function() {
        	var link_id = $(this).attr("data-link-id");
        	pm.mediator.trigger("getDirectoryCollection", link_id);
        });
    },

    showCollection: function(collection) {
    	$("#directory-collection-viewer-name").html(collection.get("name"));
    	$("#directory-collection-viewer-description").html(markdown.toHTML(collection.get("description")));
    	$("#directory-collection-viewer-updated-at").html("Last updated: " + collection.get("updated_at_formatted"));
    	$("#directory-collection-viewer-count-requests").html(collection.get("count_requests") + " endpoints");
    	$("#directory-collection-viewer .btn-primary").attr("data-id", collection.get("id"));
    	$("#directory-collection-viewer .btn-primary").attr("data-link-id", collection.get("link_id"));

    	$("#directory-collection-viewer").modal("show");
    }
});