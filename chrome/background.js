chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('requester.html', {
    "bounds": {
      width: 1200,
      height: 800
    }
  }, function(win) {
  	win.onClosed.addListener(function() {
  		console.log("On closing the window");
  	});
  });
});