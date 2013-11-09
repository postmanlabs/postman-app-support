var TCPManager = Backbone.View.extend({
	initialize: function() {
		var model = this.model;
		var view = this;

		model.on("change", this.render, this);
		pm.mediator.on("collectionsLoaded", this.renderTargetMenu, this);
		pm.mediator.on("showTCPManager", this.show, this);

		$("#modal-tcp-manager .nav li").on("click", function() {
			view.updateModel();
		});

		$("#modal-tcp-manager .btn-primary").on("click", function() {
			var status = model.get("status");

			if (status === "connected") {
				view.disconnect();
			}
			else if (status === "disconnected") {
				view.connect();
			}
		});

		this.render();
	},

	updateModel: function() {
		var model = this.model;

		var port = parseInt($("#postman-proxy-port").val(), 10);
		model.set("host", $("#postman-proxy-host").val());
		model.set("port", port);
		model.set("target", $("#postman-proxy-target").val());

		var filters = {
			"url": $("#postman-proxy-filter-url").val(),
			"methods": $("#postman-proxy-filter-methods").val(),
			"status_codes": $("#postman-proxy-filter-status-codes").val(),
			"content_type": $("#postman-proxy-filter-content-type").val(),
		};

		model.set("filters", filters);

		model.save();
	},

	renderTargetMenu: function() {
		console.log(pm.collections.getAllCollections());
	},

	connect: function() {
		this.updateModel();
		this.model.connect();
		$("#modal-tcp-manager .btn-primary").html("Disconnect");
	},

	disconnect: function() {
		this.model.disconnect();
		$("#modal-tcp-manager .btn-primary").html("Connect");
	},

	render: function() {
		var model = this.model;
		var status = model.get("status");

		if (status === "connected") {
			$("#modal-tcp-manager .status").html("Connected");
			$("#modal-tcp-manager .status").addClass("status-connected");
			$("#modal-tcp-manager .status").removeClass("status-disconnected");
			$("#modal-tcp-manager .btn-primary").html("Disconnect");
		}
		else if (status === "disconnected") {
			$("#modal-tcp-manager .status").html("Disconnected");
			$("#modal-tcp-manager .status").removeClass("status-connected");
			$("#modal-tcp-manager .status").addClass("status-disconnected");
			$("#modal-tcp-manager .btn-primary").html("Connect");
		}

		$("#postman-proxy-host").val(model.get("host"));
		$("#postman-proxy-port").val(model.get("port"));
		$("#postman-proxy-target").val(model.get("target"));

		var filters = model.get("filters");
		$("#postman-proxy-filter-url").val(filters.url);
		$("#postman-proxy-filter-methods").val(filters.methods);
		$("#postman-proxy-filter-status-codes").val(filters.status_codes);
		$("#postman-proxy-filter-content-type").val(filters.content_type);
	},

	show: function() {
		$("#modal-tcp-manager").modal("show");
	}

});