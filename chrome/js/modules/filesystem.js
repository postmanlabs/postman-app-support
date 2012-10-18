pm.filesystem = {
    fs:{},

    onInitFs:function (filesystem) {
        pm.filesystem.fs = filesystem;
    },

    errorHandler:function (e) {
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

        console.log('Error: ' + msg);
    },

    init:function () {
        window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, this.onInitFs, this.errorHandler);
    },

    removeFileIfExists:function (name, callback) {
        pm.filesystem.fs.root.getFile(name,
            {create:false}, function (fileEntry) {
                fileEntry.remove(function () {
                    callback();
                }, function () {
                    callback();
                });
            }, function () {
                callback();
            });
    },

    renderResponsePreview:function (name, data, type, callback) {
        name = encodeURI(name);
        name = name.replace("/", "_");
        pm.filesystem.removeFileIfExists(name, function () {
            pm.filesystem.fs.root.getFile(name,
                {create:true},
                function (fileEntry) {
                    fileEntry.createWriter(function (fileWriter) {

                        fileWriter.onwriteend = function (e) {
                            var properties = {
                                url:fileEntry.toURL()
                            };

                            callback(properties.url);
                        };

                        fileWriter.onerror = function (e) {
                            callback(false);
                        };

                        var blob;
                        if (type == "pdf") {
                            blob = new Blob([data], {type:'application/pdf'});
                        }
                        else {
                            blob = new Blob([data], {type:'text/plain'});
                        }
                        fileWriter.write(blob);


                    }, pm.filesystem.errorHandler);


                }, pm.filesystem.errorHandler
            );
        });
    },

    saveAndOpenFile:function (name, data, type, callback) {
        name = encodeURI(name);
        name = name.replace("/", "_");
        pm.filesystem.removeFileIfExists(name, function () {
            pm.filesystem.fs.root.getFile(name,
                {create:true},
                function (fileEntry) {
                    fileEntry.createWriter(function (fileWriter) {

                        fileWriter.onwriteend = function (e) {
                            var properties = {
                                url:fileEntry.toURL()
                            };

                            if (typeof chrome !== "undefined") {
                                chrome.tabs.create(properties, function (tab) {
                                });
                            }

                            callback();
                        };

                        fileWriter.onerror = function (e) {
                            callback();
                        };

                        var blob;
                        if (type == "pdf") {
                            blob = new Blob([data], {type:'application/pdf'});
                        }
                        else {
                            blob = new Blob([data], {type:'text/plain'});
                        }
                        fileWriter.write(blob);

                    }, pm.filesystem.errorHandler);


                }, pm.filesystem.errorHandler
            );
        });

    }
};