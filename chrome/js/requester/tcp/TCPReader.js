var TCPReader = Backbone.Model.extend({
	defaults: function() {
		return {
			"socketId": null,
			"socketInfo": null,
			"host": "127.0.0.1",
			"port": "5005",
			"target_type": "history",
			"target_id": "",
			"status": "disconnected",
			"filters": {
				"url": "",
				"url_disabled": "",
				"methods": "",
				"status_codes": "",
				"content_type": ""
			}
		}
	},

	initialize: function() {
		var model = this;

		pm.storage.getValue("readerSettings", function(settings) {
			if (settings) {
				model.set("host", settings.host);
				model.set("port", settings.port);
				model.set("target_type", settings.target_type);
				model.set("target_id", settings.target_id);

				model.set("filters", settings.filters);
			}
		});
	},

	save: function() {
		var readerSettings = {
			"readerSettings": {
				"host": this.get("host"),
				"port": this.get("port"),
				"target_type": this.get("target_type"),
				"target_id": this.get("target_id"),
				"filters": this.get("filters")
			}
		};

		pm.storage.setValue(readerSettings, function() {
		});

	},

	writeResponse: function(socketId, data, keepAlive) {
		var model = this;
		var socket = chrome.socket;

		var header = stringToUint8Array(data);
		var outputBuffer = new ArrayBuffer(header.byteLength);
		var view = new Uint8Array(outputBuffer)
		var socketInfo = this.get("socketInfo");

		view.set(header, 0);

		function onAccept(acceptInfo) {
			model.readFromSocket(acceptInfo.socketId);
		}

		socket.write(socketId, outputBuffer, function(writeInfo) {
			socket.destroy(socketId);
			socket.accept(socketInfo.socketId, onAccept);
		});
	},

	isAllowed: function(request) {
		var filters = this.get("filters");
		var methods = filters.methods.split(",");

		function trim(s) {
			return s.trim().toUpperCase();
		}

		var filterMethods = _.each(methods, trim);

		var flagUrlContains = true;
		var flagUrlDisabled = true;
		var flagUrlMethods = true;

		var result;

		console.log("Filters are", filters);

		if (filters.url === "") {
			flagUrlContains = true;
		}
		else {
			if (request.url.search(filters.url) >= 0) {
				flagUrlContains = true;
			}
			else {
				flagUrlContains = false;
			}
		}

		if (filters.url_disabled === "") {
			flagUrlDisabled = true;
		}
		else {
			if (request.url.search(filters.url_disabled) < 0) {
				flagUrlDisabled = true;
			}
			else {
				flagUrlDisabled = false;
			}
		}

		if (filterMethods.length > 0) {
			flagUrlMethods = _.indexOf(filterMethods, request.method.toUpperCase());
		}
		else {
			flagUrlMethods = true;
		}

		result = flagUrlMethods && flagUrlDisabled && flagUrlContains;
		return result;
	},

	addRequest: function(data) {
		var request = JSON.parse(data);

		var target_type = this.get("target_type");
		var collection;
		var target_id;

		console.log("Settings are", this.toJSON());

		if (this.isAllowed(request)) {
			if (target_type === "history") {
				pm.history.addRequestFromJSON(data);
			}
			else {
				target_id = this.get("target_id");
				pm.collections.addRequestToCollectionId(request, target_id);
			}
		}
	},

	readFromSocket: function(socketId) {
		var model = this;

		var socket = chrome.socket;
		socket.read(socketId, function(readInfo) {
			try {
			    console.log("READ", readInfo);
			    // Parse the request.
			    var data = arrayBufferToString(readInfo.data);
			    model.addRequest(data);
			    model.writeResponse(socketId, "received-request", false);
			}
			catch(e) {
			    console.log("Something went wrong while reading a request", e);
			    model.writeResponse(socketId, "received-request", false);
			}
		});
	},

	onAccept: function(acceptInfo) {
		console.log("ACCEPT", acceptInfo)
		this.readFromSocket(acceptInfo.socketId);
	},

	startListening: function() {
		var model = this;
		var socket = chrome.socket;
		var socketInfo;
		var socketId;

		var host = this.get("host");
		var port = this.get("port");

		function onAccept(acceptInfo) {
			console.log("ACCEPT", acceptInfo)
			model.readFromSocket(acceptInfo.socketId);
		}

		chrome.socket.create('tcp', {}, function(_socketInfo) {
			model.set("socketInfo", _socketInfo);
			model.set("socketId", _socketInfo.socketId);

			socketInfo = _socketInfo;
			socketId = _socketInfo.socketId;
			console.log("CONNECTED", _socketInfo);

			model.set("status", "connected");

			socket.listen(socketInfo.socketId, host, port, 50, function(result) {
				console.log("LISTENING:", result);
				// this.set("status", "listening");
				socket.accept(socketInfo.socketId, onAccept);
			});
		});

		console.log("Start reading TCP calls");
	},

	stopListening: function() {
		chrome.socket.destroy(this.get("socketId"));
		this.set("status", "disconnected");
	},

	connect: function() {
		this.startListening();
		// this.set("status", "connected");
	},

	disconnect: function() {
		this.stopListening();
		// this.set("status", "disconnected");
	}
});