chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('requester.html', {
    "bounds": {
      top: 10,
      left: 10,
      width: 1000,
      height: 800
    }
  }, function(win) {
  	win.onClosed.addListener(function() {
  		console.log("On closing the window");
  	});
  });
});