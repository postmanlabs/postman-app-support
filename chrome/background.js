chrome.app.runtime.onLaunched.addListener(function() {	
  chrome.app.window.create('requester.html', {    

    "bounds": {
      width: 1020,
      height: 600
    }
  });
});