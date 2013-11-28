var TCPReaderStatus = Backbone.View.extend({
	initialize: function() {
		var model = this.model;

		model.on("change", this.render, this);
		$('#tcp-reader-status').on("click", function () {
			tracker.sendEvent('proxy', 'click');
		    pm.mediator.trigger("showTCPManager");
		});
	},

	render: function() {
		var title = "Disconnected";
		var status = this.model.get("status");
		var model = this.model;
		if (status === "connected") {
			title = "Connected to " + model.get("host") + ":" + model.get("port");
			$("#tcp-reader-status img").attr("src", "img/v2/proxy_connected.png");
		}
		else if (status === "disconnected") {
			title = "Disconnected";
			$("#tcp-reader-status img").attr("src", "img/v2/proxy.png");
		}

		$("#tcp-reader-status").attr("data-original-title", title);
	}
});