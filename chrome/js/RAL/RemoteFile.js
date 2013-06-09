/**
 * Prototype for all remote files
 */
RAL.RemoteFile = function() {};

RAL.RemoteFile.prototype = {

  /**
   * The internal element used for dispatching events.
   * @type {Element}
   */
  element: null,

  /**
   * The source URL of the remote file.
   * @type {string}
   */
  src: null,

  /**
   * Whether or not this file should autoload.
   * @type {boolean}
   */
  autoLoad: false,

  /**
   * Whether or not this file should ignore the server's cache headers.
   * @type {boolean}
   */
  ignoreCacheHeaders: false,

  /**
   * The default TTL (in ms) should no expire header be provided.
   * @type {number}
   * @default 1209600000, 14 days
   */
  timeToLive: 14 * 24 * 60 * 60 * 1000,

  /**
   * The file's priority in the queue.
   * @type {number}
   * @default 1209600000, 14 days
   */
  priority: 0,

  /**
   * Whether or not the file has loaded.
   * @type {boolean}
   */
  loaded: false,

  /**
   * A reference to the URL object.
   * @type {Function}
   * @private
   */
  wURL: window.URL || window.webkitURL,

  callbacks: {

    /**
     * Callback for errors with caching this file, e.g. when the headers
     * from the server imply as such.
     * @param {object} fileInfo The file information including headers and
     *     warnings from RAL.CacheParser
     */
    onCacheError: function(fileInfo) {
      fileInfo.src = this.src;
      this.sendEvent('cacheerror', fileInfo);
    },

    /**
     * Callback for when the remote file has loaded.
     * @param {Blob} fileData The file's data.
     * @param {object} fileInfo The file information including headers and
     *     any warnings from RAL.CacheParser
     */
    onRemoteFileLoaded: function(fileData, fileInfo) {

      // check the ignorance status
      if(this.ignoreCacheHeaders) {

        fileInfo.cacheable = true;
        fileInfo.useBy += this.timeToLive;
      }

      // check if the file can be cached and, if so,
      // go ahead and store it in the file system
      if(fileInfo.cacheable) {

        RAL.FileSystem.set(this.src, fileData,
          this.callbacks.onFileSystemSet.bind(this, fileInfo));

      } else {

        var dataURL = this.wURL.createObjectURL(fileData);
        this.callbacks.onLocalFileLoaded.call(this, dataURL);
        this.callbacks.onCacheError.call(this, fileInfo);

      }

      this.sendEvent('remoteloaded', fileInfo);

    },

    /**
     * Called when the remote file is unavailable.
     */
    onRemoteFileUnavailable: function() {
      this.sendEvent('remoteunavailable');
    },

    /**
     * Called when the local file has been loaded. Since the
     * remote file will be stored as a local file, this should
     * always be fired, but it may be preceded by a 'remoteloaded'
     * event beforehand.
     * @param {string} filePath The local file system path of the file.
     */
    onLocalFileLoaded: function(filePath) {
      this.loaded = true;
      this.sendEvent('loaded', filePath);
    },

    /**
     * Called when the locally stored version of the file is
     * not available, e.g. after a file system purge. This
     * automatically requests the remote file again and shows
     * a placeholder.
     */
    onLocalFileUnavailable: function() {
      this.showPlaceholder();
      this.loadFromRemote();
      this.sendEvent('localunavailable');
    },

    /**
     * Callback for once the file has been stored in the file system. Stores
     * the file in the global manifest.
     * @param {object} fileInfo The source URL and headers for the remote file.
     */
    onFileSystemSet: function(fileInfo) {
      RAL.FileManifest.set(this.src, fileInfo,
        this.callbacks.onFileManifestSet.bind(this));
    },

    /**
     * Callback for once the file has been stored in the file manifest.
     */
    onFileManifestSet: function() {
      // we stored the file, we should reattempt
      // the load operation
      this.load();
    },

    /**
     * Callback for once the file has been retrieved from the file manifest.
     * @param {object} fileInfo The file's information from the manifest.
     */
    onFileManifestGet: function(fileInfo) {

      var time = Date.now();

      // see whether we have the file
      if(fileInfo !== null) {

        // see if it is still in date or we are offline
        if(fileInfo.useBy > time || !RAL.NetworkMonitor.isOnline()) {

          // go and grab it
          RAL.FileSystem.getPath(this.src,
            this.callbacks.onLocalFileLoaded.bind(this),
            this.callbacks.onLocalFileUnavailable.bind(this));

        } else {
          // it's out of date, so now we
          // need to get the remote file
          this.loadFromRemote();
        }

      } else {
        // we do not have the file, go
        // and get it
        this.loadFromRemote();
      }
    }
  },

  /**
   * Helper function which uses the internal DOM element
   * to create and dispatch events for the remote file.
   * @see https://developer.mozilla.org/en-US/docs/DOM/document.createEvent
   * @param {string} evtName The event name.
   * @param {*} data The event data.
   */
  sendEvent: function(evtName, data) {

    this.checkForElement();

    var evt = document.createEvent("Event");
    evt.initEvent(evtName, true, true);
    if(!!data) {
      evt.data = data;
    }
    this.element.dispatchEvent(evt);

  },

  /**
   * Loads a file from a remote source.
   */
  loadFromRemote: function() {

    RAL.Loader.load(this.src,
      'blob',
      this.callbacks.onRemoteFileLoaded.bind(this),
      this.callbacks.onRemoteFileUnavailable.bind(this));

    this.sendEvent('remoteloadstart');
  },

  /**
   * Attempts to load a file from the local file system.
   */
  load: function() {
    // check the "manifest" to see if
    // we should already have this file
    RAL.FileManifest.get(this.src, this.callbacks.onFileManifestGet.bind(this));

  },

  /**
   * Checks for and creates an element for handling events.
   */
  checkForElement: function() {
    if(!this.element) {
      // create a placeholder element
      // in lieu of having an actual one. Likely
      // to be the case where someone has created
      // a RemoteFile directly
      this.element = document.createElement('span');
    }
  },

  /**
   * Wrapper for event listening on the internal element.
   * @param {string} evtName The event name to listen for.
   * @param {Function} callback The event callback.
   * @param {boolean} useCapture Use capture for the event.
   */
  addEventListener: function(evtName, callback, useCapture) {
    this.checkForElement();
    this.element.addEventListener(evtName, callback, useCapture);
  }
};
