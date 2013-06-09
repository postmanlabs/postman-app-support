/**
 * Tracks the online / offline nature of the
 * browser so we can abort and reschedule any
 * in-flight requests.
 */
RAL.NetworkMonitor = (function() {

  var onlineListeners = [];
  var offlineListeners = [];

  /* Register for online events */
  window.addEventListener("online", function() {

    // go through each listener, pop it
    // off and call it
    var listenerCount = onlineListeners.length,
        listener = null;
    while(listenerCount--) {
      listener = onlineListeners.pop();
      listener();
    }
  });

  /* Register for offline events */
  window.addEventListener("offline", function() {

    // go through each listener, pop it
    // off and call it
    var listenerCount = offlineListeners.length,
        listener = null;
    while(listenerCount--) {
      listener = offlineListeners.pop();
      listener();
    }
  });

  /**
   * Appends a function for notification
   * when the browser comes back online.
   * @param callback The callback function for online notifications.
   */
  function registerForOnline(callback) {
    onlineListeners.push(callback);
  }

  /**
   * Appends a function for notification
   * when the browser drops offline.
   * @param callback The callback function for offline notifications.
   */
  function registerForOffline(callback) {
    offlineListeners.push(callback);
  }

  /**
   * Simple wrapper for whether the browser
   * is online or offline.
   * @returns {boolean} The online / offline state of the browser.
   */
  function isOnline() {
    return window.navigator.onLine;
  }

  return {
    registerForOnline: registerForOnline,
    registerForOffline: registerForOffline,
    isOnline: isOnline
  };

})();
