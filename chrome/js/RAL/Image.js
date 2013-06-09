/**
 * Represents a remote image.
 * @param {object} options The configuration options.
 */
RAL.RemoteImage = function(options) {

  // make sure to override the prototype
  // refs with the ones for this instance
  RAL.RemoteFile.call(this);

  options = options || {};

  this.element = options.element || document.createElement('img');
  this.src = this.element.dataset.src || options.src;
  this.width = this.element.width || options.width || null;
  this.height = this.element.height || options.height || null;
  this.placeholder = this.element.dataset.placeholder || null;
  this.priority = options.priority || 0;

  // attach on specific events for images
  this.addEventListener('remoteloadstart', this.showPlaceholder.bind(this));
  this.addEventListener('loaded', this.showImage.bind(this));

  if(typeof options.autoLoad !== "undefined") {
    this.autoLoad = options.autoLoad;
  }

  if(typeof options.ignoreCacheHeaders !== "undefined") {
    this.ignoreCacheHeaders = options.ignoreCacheHeaders;
  }

  // if there is a TTL use that instead of the default
  if(this.ignoreCacheHeaders && typeof this.timeToLive !== "undefined") {
    this.timeToLive = options.timeToLive;
  }

  if(this.autoLoad) {
    this.load();
  } else {
    this.showPlaceholder();
  }

};

RAL.RemoteImage.prototype = new RAL.RemoteFile();

/**
 * Shows a placeholder image while we load in the main image
 */
RAL.RemoteImage.prototype.showPlaceholder = function() {

  if(this.placeholder !== null) {

    // add in transitions
    this.element.style['-webkit-transition'] = "background-image 0.5s ease-out";
    this.showImage({data:this.placeholder});
  }
};

/**
 * Shows the image.
 * @param {event} evt The loaded event for the asset.
 */
RAL.RemoteImage.prototype.showImage = function(evt) {

  var imageSrc = evt.data;
  var image = new Image();
  var revoke = (function(imageSrc) {
    this.wURL.revokeObjectURL(imageSrc);
  }).bind(this, imageSrc);

  var imageLoaded = function() {

    // infer the size from the image
    var width = this.width || image.naturalWidth;
    var height = this.height || image.naturalHeight;

    this.element.style.width = width + 'px';
    this.element.style.height = height + 'px';
    this.element.style.backgroundImage = 'url(' + imageSrc + ')';
    this.element.style.backgroundSize = width + 'px ' + height + 'px';

    // if it's a blob make sure we go ahead
    // and revoke it properly after a short timeout
    if(/blob:/.test(imageSrc)) {
      setTimeout(revoke, 100);
    }
  };

  image.onload = imageLoaded.bind(this);
  image.src = imageSrc;
};
