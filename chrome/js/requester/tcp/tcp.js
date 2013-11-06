$(document).ready(function() {
	var socketId;
	var ci;
	var IP = "127.0.0.1";
	var PORT = 5005;
	chrome.socket.create('tcp', {}, function(createInfo) {
		socketId = createInfo.socketId;
		ci = createInfo;
		console.log(createInfo);

		chrome.socket.connect(createInfo.socketId, IP, PORT, function() {
			console.log("Connected TCP socket");

			var func = setInterval(function() {
				chrome.socket.read(socketId, null, function(readInfo) {
					if (readInfo.resultCode > 0) {
						chrome.socket.write(socketId, readInfo.data, function() {
							console.log("Found data in socket", readInfo);
							console.log(ab2str(readInfo.data));
							console.log("Written the data");
							window.clearInterval(func);
						});
					}
				});
			}, 10);


		});
	});
	console.log("Start reading TCP calls");
});