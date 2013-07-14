var ResponseBodyImageViewer = Backbone.View.extend({
    initialize: function() {
    	var model = this.model;
    	var response = model.get("response");
    	response.on("finishedLoadResponse", this.render, this);
    },

    render: function() {
    	var model = this.model;
    	var request = model;
    	var response = model.get("response");
    	var previewType = response.get("previewType");

    	if (previewType === "image") {
    		$('#response-as-image').css("display", "block");
    		
    		var imgLink = request.get("url");
    		var remoteImage = new RAL.RemoteImage({
    		    priority: 0,
    		    src: imgLink,
    		    headers: request.getXhrHeaders()
    		});

    		remoteImage.addEventListener('loaded', function(remoteImage) {
    		});

    		$("#response-as-image").html("");
    		var container = document.querySelector('#response-as-image');
    		container.appendChild(remoteImage.element);

    		RAL.Queue.add(remoteImage);
    		RAL.Queue.setMaxConnections(4);
    		RAL.Queue.start();
    	}
    }
});