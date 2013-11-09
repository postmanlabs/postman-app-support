var TCPReader = Backbone.Model.extend({
	defaults: function() {
		return {
			"socketId": null,
			"socketInfo": null,
			"host": "127.0.0.1",
			"port": 5005,
			"status": "disconnected",
			"filters": {}
		}
	},

	initialize: function() {
		console.log("Initializing TCPReader");
		this.startListening();
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

			this.set("status", "connected");

			socket.listen(socketInfo.socketId, host, port, 50, function(result) {
				console.log("LISTENING:", result);
				this.set("status", "listening");
				socket.accept(socketInfo.socketId, onAccept);
			});
		});

		console.log("Start reading TCP calls");
	},

	stopListening: function() {
		chrome.socket.destroy(this.get("socketId"));
		this.set("status", "disconnected");
	}
});