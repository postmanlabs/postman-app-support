/**
 * Parses cache headers so that we can respect them.
 */
RAL.CacheParser = (function() {

  /**
   * Parses headers to determine whether there is
   * anything in there that we need to know about, e.g.
   * no-cache or no-store.
   * @param {string} headers The XHR headers to parse.
   * @see http://www.mnot.net/cache_docs/
   * @returns {object} An object with the extracted expiry for the asset.
   */
  function parse(headers) {

    var rMaxAge = /max\-age=(\d+)/gi;
    var rNoCache = /Cache-Control:.*?no\-cache/gi;
    var rNoStore = /Cache-Control:.*?no\-store/gi;
    var rMustRevalidate = /Cache-Control:.*?must\-revalidate/gi;
    var rExpiry = /Expires:\s(.*)/gi;

    var warnings = [];
    var expires = rMaxAge.exec(headers);
    var useBy = Date.now();

    // check for no-store
    if(rNoStore.test(headers)) {
      warnings.push("Cache-Control: no-store is set");
    }

    // check for no-cache
    if(rNoCache.test(headers)) {
      warnings.push("Cache-Control: no-cache is set");
    }

    // check for must-revalidate
    if(rMustRevalidate.test(headers)) {
      warnings.push("Cache-Control: must-revalidate is set");
    }

    // if no max-age is set check
    // for an Expires value
    if(expires !== null) {
      useBy = Date.now() + (expires[1] * 1000);
    } else {

      // attempt to use the Expires: header
      expires = rExpiry.exec(headers);

      // if that fails warn
      if(expires !== null) {
        useBy = Date.parse(expires[1]);
      } else {
        warnings.push("Cache-Control: max-age and Expires: headers are not set");
      }
    }

    return {
      headers: headers,
      cacheable: (warnings.length === 0),
      useBy: useBy,
      warnings: warnings
    };
  }

  return {
    parse: parse
  };

})();
