// $(document).ready(function() {
// 	var socketId;
// 	var socketInfo;
// 	var socket = chrome.socket;
// 	var ci;
// 	var IP = "127.0.0.1";
// 	var PORT = 5005;

// 	var writeResponse = function(socketId, data, keepAlive) {
// 		var header = stringToUint8Array(data);
// 		var outputBuffer = new ArrayBuffer(header.byteLength);
// 		var view = new Uint8Array(outputBuffer)
// 		view.set(header, 0);
// 		socket.write(socketId, outputBuffer, function(writeInfo) {
// 			console.log("WRITE", writeInfo);
// 			socket.destroy(socketId);
// 			socket.accept(socketInfo.socketId, onAccept);
// 		});
// 	};

// 	function readFromSocket(socketId) {
// 	  //  Read in the data
// 		socket.read(socketId, function(readInfo) {
// 			console.log("READ", readInfo);
// 			// Parse the request.
// 			var data = arrayBufferToString(readInfo.data);
// 			console.log("DATA", data);
// 			pm.history.addRequestFromJSON(data);
// 			writeResponse(socketId, "It worked!", false);
// 		});
// 	};

// 	function onAccept(acceptInfo) {
// 		console.log("ACCEPT", acceptInfo)
// 		readFromSocket(acceptInfo.socketId);
// 	}

// 	chrome.socket.create('tcp', {}, function(_socketInfo) {
// 		socketInfo = _socketInfo;
// 		socketId = _socketInfo.socketId;
// 		ci = _socketInfo;
// 		console.log("CONNECTED", _socketInfo);

// 		socket.listen(socketInfo.socketId, IP, PORT, 50, function(result) {
// 			console.log("LISTENING:", result);
// 			socket.accept(socketInfo.socketId, onAccept);
// 		});
// 	});

// 	console.log("Start reading TCP calls");
// });