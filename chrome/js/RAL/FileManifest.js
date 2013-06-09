/**
 * Represents the internal log of all files that
 * have been cached for offline use.
 */
RAL.FileManifest = (function() {

  var manifest = null,
      ready = false,
      readyListeners = [],
      saving = false,
      hasUpdated = false;

  /**
   * Determines if the manifest is ready for use.
   * @returns {boolean} If the manifest is ready.
   */
  function isReady() {
    return ready;
  }

  /**
   * Registers a listener for when the manifest is
   * ready for interaction.
   * @param {Function} listener The listener function.
   */
  function registerOnReady(listener) {
    readyListeners.push(listener);
  }

  /**
   * Gets the file information from the manifest.
   * @param {string} src The source URL of the asset.
   * @param {Function} callback The callback function to
   *      call with the asset details.
   */
  function get(src, callback) {
    var cleanSrc = RAL.Sanitiser.cleanURL(src);
    var fileInfo = manifest[cleanSrc] || null;
    callback(fileInfo);
  }

  /**
   * Sets the file information in the manifest.
   * @param {string} src The source URL of the asset.
   * @param {object} info The information to store against the asset.
   * @param {Function} callback The callback function to
   *      call once the asset details have been saved.
   */
  function set(src, info, callback) {
    var cleanSrc = RAL.Sanitiser.cleanURL(src);
    manifest[cleanSrc] = info;
    save(callback);
  }

  /**
   * Resets the manifest of files.
   */
  function reset() {
    manifest = {};
    save();
  }

  /**
   * Callback for when there is no manifest available.
   * @private
   */
  function onManifestUnavailable() {
    onManifestLoaded("{}");
  }

  /**
   * Callback for when there is no manifest has laded. Passes through the
   * registered ready callbacks and fires each in turn.
   * @param {string} The JSON representation of the manifest.
   * @private
   */
  function onManifestLoaded(fileData) {

    ready = true;
    manifest = JSON.parse(fileData);

    if (readyListeners.length) {
      var listener = readyListeners.length;
      while(listener--) {
        readyListeners[listener]();
      }
    }
  }

  /**
   * Saves the manifest file.
   * @private
   */
  function save(callback) {

    var blob = new Blob([
      JSON.stringify(manifest)
    ], {type: 'application/json'});

    // Called whether or not the file exists
    RAL.FileSystem.set("manifest.json", blob, function() {
      if(!!callback) {
        callback();
      }
    });
  }

  /**
   * Requests the manifest JSON file from the file system.
   */
  function init() {
    RAL.FileSystem.getDataAsText("manifest.json",
      onManifestLoaded,
      onManifestUnavailable);
  }

  // check if the file system is good to go. If not, then
  // flag that we want to know when it is.
  if (RAL.FileSystem.isReady()) {
    init();
  } else {
    RAL.FileSystem.registerOnReady(init);
  }

  return {
    isReady: isReady,
    registerOnReady: registerOnReady,
    get: get,
    set: set,
    reset: reset
  };

})();
