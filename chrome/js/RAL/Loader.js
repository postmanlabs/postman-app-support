/**
 * Loads the remote files
 */
RAL.Loader = (function() {

  var callbacks = {

    /**
     * Callback for loaded files.
     * @param {string} source The remote file's URL.
     * @param {Function} callbackSuccess The callback for successful loading.
     * @param {Function} callbackError The callback for failed loading.
     * @param {ProgressEvent} xhrProgressEvent The XHR progress event.
     */
    onLoad: function(source, callbackSuccess, callbackError, xhrProgressEvent) {

      // we have the file details
      // so now we need to wrap the file up, including
      // the caching information to return back
      var xhr = xhrProgressEvent.target;
      var fileData = xhr.response;
      var fileInfo = RAL.CacheParser.parse(xhr.getAllResponseHeaders());

      if(xhr.readyState === 4) {
        if(xhr.status === 200) {
          callbackSuccess(fileData, fileInfo);
        } else {
          callbackError(xhrProgressEvent);
        }
      }
    },

    /**
     * Generic callback for erroring loads. Simply passes the progres event
     * through to the assigned callback.
     * @param {Function} callback The callback for failed loading.
     * @param {ProgressEvent} xhrProgressEvent The XHR progress event.
     */
    onError: function(callback, xhrProgressEvent) {
      callback(xhrProgressEvent);
    }
  };

  /**
   * Aborts an in-flight XHR and reschedules it.
   * @param {XMLHttpRequest} xhr The XHR to abort.
   * @param {Function} callbackSuccess The callback for successful loading.
   * @param {Function} callbackError The callback for failed loading.
   * @param {ProgressEvent} xhrProgressEvent The XHR progress event.
   */
  function abort(xhr, source, callbackSuccess, callbackFail) {

    // kill the current request
    xhr.abort();

    // run it again, which will cause us to schedule up
    this.load(source, callbackSuccess, callbackFail);
  }

  /**
   * Aborts an in-flight XHR and reschedules it.
   * @param {XMLHttpRequest} xhr The XHR to abort.
   * @param {string} type The response type for the XHR, e.g. 'blob'
   * @param {Function} callbackSuccess The callback for successful loading.
   * @param {Function} callbackError The callback for failed loading.
   */
  function load(source, type, callbackSuccess, callbackFail) {

    // check we're online, or schedule the load
    if(RAL.NetworkMonitor.isOnline()) {

      // attempt to load the file
      var xhr = new XMLHttpRequest();

      xhr.responseType = type;
      xhr.onerror = callbacks.onError.bind(this, callbackFail);
      xhr.onload = callbacks.onLoad.bind(this, source, callbackSuccess, callbackFail);
      xhr.open('GET', source, true);
      xhr.send();

      // register our interest in the connection
      // being cut. If that happens we will reschedule.
      RAL.NetworkMonitor.registerForOffline(
        abort.bind(this,
          xhr,
          source,
          callbackSuccess,
          callbackFail));

    } else {

      // We are offline so register our interest in the
      // connection being restored.
      RAL.NetworkMonitor.registerForOnline(
        load.bind(this,
          source,
          callbackSuccess,
          callbackFail));

    }
  }

  return {
    load: load
  };

})();
