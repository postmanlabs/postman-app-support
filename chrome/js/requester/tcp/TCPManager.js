var TCPManager = Backbone.View.extend({
	initialize: function() {
		var model = this.model;
		var view = this;

		model.on("change", this.render, this);
		pm.mediator.on("refreshCollections", this.renderTargetMenu, this);
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

		var target_value = $("#postman-proxy-target").val();
		var target_type;
		var target_id;

		if (target_value === "history_history") {
			target_type = "history";
			target_id = "history";
		}
		else {
			target_type = "collection";
			target_id = target_value.split("_")[1];
		}

		model.set("target_type", target_type);
		model.set("target_id", target_id);

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
		var model = this.model;
		console.log(pm.collections.getAllCollections());

		var collections = pm.collections.getAllCollections();
		var collection;
		$("#postman-proxy-target").html("");
		var history = {
			"proxy_target_value": "history",
			"name": "History",
			"id": "history"
		};

		$('#postman-proxy-target').append(Handlebars.templates.item_tcp_reader_target(history));

		for(var i = 0; i < collections.length; i++) {
			collection = _.clone(collections[i].toJSON());
			collection["proxy_target_value"] = "collection";
			collection["name"] = "Collection: " + collection["name"];
			$('#postman-proxy-target').append(Handlebars.templates.item_tcp_reader_target(collection));
		}

		$("#postman-proxy-target").val(model.get("target_id"));
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

		var target_value = model.get("target_type") + "_" + model.get("target_id");
		$("#postman-proxy-target").val(target_value);

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