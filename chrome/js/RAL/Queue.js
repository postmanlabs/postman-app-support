/**
 * Represents the load queue for assets.
 */
RAL.Queue = (function() {

  var heap = new RAL.Heap(),
      connections = 0,
      maxConnections = 6,
      callbacks = {

        /**
         * Callback for when a file in the queue has been loaded
         */
        onFileLoaded: function() {
          if(RAL.debug) {
            console.log("[Connections: " + connections + "] - File loaded");
          }
          connections--;
          start();
        }
      };

  /**
   * Gets the queue's next priority value.
   */
  function getNextHighestPriority() {
    return heap.getNextHighestPriority();
  }

  /**
   * Sets the queue's maximum number of concurrent requests.
   * @param {number} newMaxConnections The maximum number of in-flight requests.
   */
  function setMaxConnections(newMaxConnections) {
    maxConnections = newMaxConnections;
  }

  /**
   * Adds a file to the queue.
   * @param {RAL.REmoteFile} remoteFile The file to enqueue.
   * @param {boolean} startGetting Whether or not to try and get immediately.
   */
  function add(remoteFile, startGetting) {

    // ensure we have a priority, and
    // go with a LIFO approach
    // - thx courage@
    if(typeof remoteFile.priority === "undefined") {
      remoteFile.priority = heap.getNextHighestPriority();
    }

    heap.add(remoteFile);

    if(startGetting) {
      start();
    }
  }

  /**
   * Start requesting items from the queue.
   */
  function start() {
    while(connections < maxConnections) {
      nextFile = heap.remove();

      if(nextFile !== null) {
        nextFile.addEventListener('loaded', callbacks.onFileLoaded);
        nextFile.load();
        if(RAL.debug) {
          console.log("[Connections: " + connections + "] - Loading " + nextFile.src);
        }
        connections++;
      } else {
        if(RAL.debug) {
          console.log("[Connections: " + connections + "] - No more images queued");
        }
        break;
      }
    }
  }

  /**
   * Clears the queue.
   */
  function clear() {
    heap.clear();
  }

  return {
    getNextHighestPriority: getNextHighestPriority,
    setMaxConnections: setMaxConnections,
    add: add,
    clear: clear,
    start: start
  };

})();
