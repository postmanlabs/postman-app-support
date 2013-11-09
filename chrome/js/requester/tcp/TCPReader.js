var TCPReader = Backbone.Model.extend({
	defaults: function() {
		return {
			"socketId": null,
			"socketInfo": null,
			"host": "127.0.0.1",
			"port": "5005",
			"target_type": "",
			"target_id": "",
			"status": "disconnected",
			"filters": {
				"url": "",
				"methods": "",
				"status_codes": "",
				"content_type": ""
			}
		}
	},

	initialize: function() {
		var model = this;

		console.log("Initializing TCPReader");

		pm.storage.getValue("readerSettings", function(settings) {
			if (settings) {
				console.log("Loaded readerSettings", settings);
				model.set("host", settings.host);
				model.set("port", settings.port);

				if ("target_type" in settings) {
					model.set("target_type", settings.target_type);
					model.set("target_id", settings.target_id);
				}

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
			console.log("Saved readerSettings", readerSettings);
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
			console.log("ACCEPT", acceptInfo)
			model.readFromSocket(acceptInfo.socketId);
		}

		socket.write(socketId, outputBuffer, function(writeInfo) {
			console.log("WRITE", writeInfo);
			socket.destroy(socketId);
			socket.accept(socketInfo.socketId, onAccept);
		});
	},

	readFromSocket: function(socketId) {
		var model = this;

		var socket = chrome.socket;
		socket.read(socketId, function(readInfo) {
			console.log("READ", readInfo);
			// Parse the request.
			var data = arrayBufferToString(readInfo.data);
			console.log("DATA", data);
			pm.history.addRequestFromJSON(data);
			model.writeResponse(socketId, "It worked!", false);
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