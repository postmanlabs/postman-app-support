chrome.app.runtime.onLaunched.addListener(function() {	
  chrome.app.window.create('index.html', {    

    "bounds": {
      width: 1020,
      height: 600
    }
  });
});