chrome.app.runtime.onLaunched.addListener(function() {	
  chrome.app.window.create('index.html', {
    "id": "postman_window_main",
    "state": "maximized"
  });
});