/** npm install uglify-js **/
var UglifyJS = require("uglify-js");
var FS = require('fs');

var result = UglifyJS.minify (

  // files
  [
    "Namespace.js",
    "Heap.js",
    "Sanitiser.js",
    "CacheParser.js",
    "FileSystem.js",
    "FileManifest.js",
    "RemoteFile.js",
    "Image.js",
    "Loader.js",
    "NetworkMonitor.js",
    "Queue.js"
  ],

  // options
  {
    outSourceMap: "ral.map",
    sourceRoot: "/lib/RAL/"
  }
);

result.code += "//@ sourceMappingURL=ral.map";

FS.writeFileSync('../ral.min.js', result.code);
FS.writeFileSync('../ral.map', result.map);
