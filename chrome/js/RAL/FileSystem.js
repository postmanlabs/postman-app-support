/**
 * FileSystem API wrapper. Makes extensive use of
 * the FileSystem code from Eric Bidelman.
 *
 * @see http://www.html5rocks.com/en/tutorials/file/filesystem/
 */
RAL.FileSystem = (function() {

  var ready = false,
      readyListeners = [],
      root = null,
      callbacks = {

        /**
         * Generic error handler, simply warns the user
         */
        onError: function(e) {
          var msg = '';

          switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
              msg = 'QUOTA_EXCEEDED_ERR';
              break;
            case FileError.NOT_FOUND_ERR:
              msg = 'NOT_FOUND_ERR';
              break;
            case FileError.SECURITY_ERR:
              msg = 'SECURITY_ERR';
              break;
            case FileError.INVALID_MODIFICATION_ERR:
              msg = 'INVALID_MODIFICATION_ERR';
              break;
            case FileError.INVALID_STATE_ERR:
              msg = 'INVALID_STATE_ERR';
              break;
            default:
              msg = 'Unknown Error';
              break;
          }

          console.error('Error: ' + msg, e);
        },

        /**
         * Callback for once the file system has been fired up.
         * Informs any listeners waiting on it.
         */
        onInitialised: function(fs) {
          root = fs.root;
          ready = true;

          if(readyListeners.length) {
            var listener = readyListeners.length;
            while(listener--) {
              readyListeners[listener]();
            }
          }
        }
      };

  /**
   * Determines if the file system is ready for use.
   * @returns {boolean} If the file system is ready.
   */
  function isReady() {
    return ready;
  }

  /**
   * Registers a listener for when the file system is
   * ready for interaction.
   * @param {Function} listener The listener function.
   */
  function registerOnReady(listener) {
    readyListeners.push(listener);
  }

  /**
   * Gets the internal file system URL for a stored file
   * @param {string} filePath The original URL of the asset.
   * @param {Function} callbackSuccess Callback for successful path retrieval.
   * @param {Function} callbackFail Callback for failed path retrieval.
   */
  function getPath(filePath, callbackSuccess, callbackFail) {
    if (ready) {

      filePath = RAL.Sanitiser.cleanURL(filePath);

      root.getFile(filePath, {}, function(fileEntry) {
        callbackSuccess(fileEntry.toURL());
      }, callbackFail);
    }
  }

  /**
   * Gets the file data as text for a stored file
   * @param {string} filePath The original URL of the asset.
   * @param {Function} callbackSuccess Callback for successful path retrieval.
   * @param {Function} callbackFail Callback for failed path retrieval.
   */
  function getDataAsText(filePath, callbackSuccess, callbackFail) {

    if (ready) {

      filePath = RAL.Sanitiser.cleanURL(filePath);

      root.getFile(filePath, {}, function(fileEntry) {

        fileEntry.file(function(file) {
          var reader = new FileReader();
          reader.onloadend = function(evt) {
            callbackSuccess(this.result);
          };

          reader.readAsText(file);
        });

      }, callbackFail);
    }
  }

  /**
   * Puts the file data in the file system.
   * @param {string} filePath The original URL of the asset.
   * @param {Blob} fileData The file data blob to store.
   * @param {Function} callback Callback for file storage.
   */
  function set(filePath, fileData, callback) {

    if(ready) {

      filePath = RAL.Sanitiser.cleanURL(filePath);

      var dirPath = filePath.split("/");
      dirPath.pop();

      // create the directories all the way
      // down to the path
      createDir(root, dirPath, function() {

        // now get a reference to our file, create it
        // if necessary
        root.getFile(filePath, {create: true}, function(fileEntry) {

          // create a writer on the file reference
          fileEntry.createWriter(function(fileWriter) {

            // catch on file ends
            fileWriter.onwriteend = function(e) {

              // update the writeend so when we have
              // truncated the file data we call the callback
              fileWriter.onwriteend = function(e) {
                callback(fileEntry.toURL());
              };

              // now truncate the file contents
              // for when we overwrite with a smaller file
              fileWriter.truncate(fileData.size);
            };

            // warn on write fails but right now don't bail
            fileWriter.onerror = function(e) {
              console.warn('Write failed: ' + e.toString());
            };

            // start writing
            fileWriter.write(fileData);

          }, callbacks.onError);

        }, callbacks.onError);
      });
    }
  }

  /**
   * Recursively creates the directories in a path.
   * @param {DirectoryEntry} rootDirEntry The base directory for this call.
   * @param {Array.<string>} dirs The subdirectories in this path.
   * @param {Function} onCreated The callback function to use when all
   *     directories have been created.
   */
  function createDir(rootDirEntry, dirs, onCreated) {

    // remove any empty or dot dirs
    if(dirs[0] === '.' || dirs[0] === '') {
      dirs = dirs.slice(1);
    }

    // on empty call this done
    if(!dirs.length) {
      onCreated();
    } else {

      // create the subdirectory and recursively call
      rootDirEntry.getDirectory(dirs[0], {create: true}, function(dirEntry) {
        if (dirs.length) {
          createDir(dirEntry, dirs.slice(1), onCreated);
        }
      }, callbacks.onError);
    }
  }

  /**
   * Removes a directory.
   * @param {string} path The directory to remove.
   * @param {Function} onRemoved The callback for successful deletion.
   * @param {Function} onCreated The callback for failed deletion.
   */
  function removeDir(path, onRemoved, onError) {
    if(ready) {
      root.getDirectory(path, {}, function(dirEntry) {
        dirEntry.removeRecursively(onRemoved, callbacks.onError);
      }, onError || callbacks.onError);
    }
  }

  /**
   * Removes a file.
   * @param {string} path The file to remove.
   * @param {Function} onRemoved The callback for successful deletion.
   * @param {Function} onCreated The callback for failed deletion.
   */
  function removeFile(path, onRemoved, onError) {
    if(ready) {
      root.getFile(path, {}, function(fileEntry) {
        fileEntry.remove(onRemoved, callbacks.onError);
      }, onError || callbacks.onError);
    }
  }

  /**
   * Initializes the file system.
   * @param {number} storageSize The storage size in MB.
   */
  (function init(storageSize) {

    storageSize = storageSize || 10;

    window.requestFileSystem = window.requestFileSystem ||
      window.webkitRequestFileSystem;

    window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL ||
      window.webkitResolveLocalFileSystemURL;

    if(!!window.requestFileSystem) {
      window.requestFileSystem(
        window.TEMPORARY,
        storageSize * 1024 * 1024,
        callbacks.onInitialised,
        callbacks.onError);
    } else {

    }
  })();

  return {
    isReady: isReady,
    registerOnReady: registerOnReady,
    getPath: getPath,
    getDataAsText: getDataAsText,
    set: set,
    removeFile: removeFile,
    removeDir: removeDir
  };
})();
