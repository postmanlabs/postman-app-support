function handleClientLoad() {
    pm.drive.checkAuth();
}

pm.drive = {
    auth: {},
    CLIENT_ID: '805864674475.apps.googleusercontent.com',
    SCOPES: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        // Add other scopes needed by your application.
    ],

    changes: [],
    isSyncing: false,
    isQueueRunning: false,

    init: function() {
        //Show drive dialog for the first time user
        //Start drive authentication flow only after the user says yes
        //Do not pester every time        
    },

    isSyncEnabled: function() {
        return pm.settings.get("driveSyncEnabled");
    },

    areChangesRemaining: function() {
        var size = pm.drive.changes.length;

        if (size > 0) {
            return true;
        }
        else {
            return false;
        }
    },

    removeChange: function(changeId) {
        pm.indexedDB.driveChanges.deleteDriveChange(changeId, function(e) {
            console.log("Removed drive change");
            
            var size = pm.drive.changes.length;

            for(var i = 0; i < size; i++) {
                var c = pm.drive.changes[i];

                if (c.id === changeId) {
                    break;
                }
            }

            pm.drive.changes.splice(i, 1);

            pm.drive.isQueueRunning = false;
            pm.drive.runChangeQueue();                        
        });
    },

    executeChange: function(change) {
        pm.drive.isQueueRunning = true;

        var changeId = change.id;
        var changeTargetId = change.targetId;
        var changeTargetType = change.targetType;
        var method = change.method;    
        var type = "application/json";

        var fileId;
        var file;
        var fileData;
        var name;

        if ("fileId" in change) {
            fileId = change.fileId;            
        }

        if ("file" in change) {
            file = change.file;
        }

        if ("fileData" in change) {
            fileData = change.fileData;
        }

        if ("name" in change) {
            name = change.name;
        }                            

        if (method === "POST") {
            pm.drive.postFile(name, type, fileData, function(file) {
                console.log("Posted file", file);
                //Create file inside driveFiles
                var localDriveFile = {
                    "id": changeTargetId,
                    "type": changeTargetType,
                    "timestamp":new Date().getTime(),
                    "fileId": file.id,
                    "file": file
                };

                pm.indexedDB.driveFiles.addDriveFile(localDriveFile, function(e) {
                    console.log("Uploaded file", localDriveFile);
                    //Remove the change inside driveChange
                    pm.drive.removeChange(changeId);    

                    var currentTime = new Date().toUTCString();
                    pm.settings.set("lastDriveChangeTime", currentTime);                
                });                
                
            });
        }
        else if (method === "TRASH") {
            pm.drive.trashFile(fileId, function() {
                pm.indexedDB.driveFiles.deleteDriveFile(changeTargetId, function() {
                    console.log("Deleted local file");
                    pm.drive.removeChange(changeId);    

                    var currentTime = new Date().toUTCString();
                    pm.settings.set("lastDriveChangeTime", currentTime);                        
                });
            });
        }
        else if (method === "UPDATE") {            
            pm.drive.updateFile(name, file, fileData, function(updatedFile) {
                var updatedLocalDriveFile = {
                    "id": changeTargetId,
                    "type": changeTargetType,
                    "timestamp":new Date().getTime(),
                    "fileId": updatedFile.id,
                    "file": updatedFile
                };

                pm.indexedDB.driveFiles.updateDriveFile(updatedLocalDriveFile, function() {
                    //Remove the change inside driveChange
                    pm.drive.removeChange(changeId);    

                    var currentTime = new Date().toUTCString();
                    pm.settings.set("lastDriveChangeTime", currentTime);                                     
                });                
            });            
        }
    },

    //Executes all changes one by one
    runChangeQueue: function() {
        console.log("Run change queue called");
        if (pm.drive.isQueueRunning === true) return;

        var changes = pm.drive.changes;

        if (changes.length > 0) {
            pm.drive.executeChange(changes[0]);    
        }
        else {
            pm.drive.isQueueRunning = false;
        }                
    },

    /**
     * Called when the client library is loaded.
     */
    handleClientLoad: function() {
        console.log("Client has loaded");    
        pm.drive.isSyncing = true;
        var startChangeId = pm.settings.get("driveStartChangeId");
        startChangeId = parseInt(startChangeId, 10) + 1;
        console.log(startChangeId);
        pm.drive.getChangeList(function(changes) {
            //Show indicator here. Block UI changes with an option to skip
            //Changes is a collection of file objects
            pm.drive.isSyncing = false;

            if (changes.length > 0) {
                console.log("Received changes", changes);    
                pm.drive.filterChangesFromDrive(changes);
            }
            else {
                console.log("No new changes");
            }
            
        }, startChangeId);  
    },

    filterChangesFromDrive: function(changes) {
        console.log("Changes are ", changes);
        var lastTime = new Date(pm.settings.get("lastDriveChangeTime"));

        if (!lastTime) {
            lastTime = 0;
        }

        var filteredChanges = []; //Only the latest ones
        var size = changes.length;
        var change;

        for(var i = 0; i < size; i++) {
            change = changes[i];

            var deleted = change.deleted;

            if (!deleted) {
                var file = change.file;
                var modifiedDate = file.modifiedDate;

                var t = new Date(modifiedDate);
                console.log(t.toISOString(), lastTime.toISOString());

                //If file was modified after last change was pushed from this client
                if (lastTime.getTime()) {
                    if (t.getTime() > lastTime.getTime()) {
                        filteredChanges.push(change);
                    }    
                }
                else {
                    filteredChanges.push(change);
                }                
            }
            else {
                filteredChanges.push(change);
            }
        }

        pm.drive.implementFilteredChanges(filteredChanges);
    },

    implementFilteredChanges: function(changes) {
        console.log("Filtered changes are ", changes);
        var size = changes.length;
        var change;
        for(var i = 0; i < size; i++) {
            change = changes[i];
            var deleted = change.deleted;
            var fileId = change.fileId;
            if (deleted) {
                pm.drive.deleteDriveFile(fileId);
            }
            else {
                var file = change.file;
                pm.drive.createOrUpdateFile(fileId, file);
            }
        }
    },    

    deleteDriveFile: function(fileId) {
        pm.indexedDB.driveFiles.getDriveFileByFileId(fileId, function(file) {            
            var type = file.type;
            var id = file.id;

            if (type === "collection") {
                pm.collections.deleteCollection(id, false);
                pm.indexedDB.driveFiles.deleteDriveFile(id);
            }
        });
    },

    createOrUpdateFile: function(fileId, file) {
        pm.indexedDB.driveFiles.getDriveFileByFileId(fileId, function(localDriveFile) {
            console.log("Trying to fetch the file", fileId, localDriveFile);
            
            if (localDriveFile) {
                //Local drive file exists
                console.log("Update file");
                pm.drive.getFile(file, function(responseText) {
                    console.log("Obtained file from drive", responseText);
                    if (file.fileExtension === "postman_collection") {
                        console.log("File extension is", file.fileExtension);
                        var collection = JSON.parse(responseText);
                        console.log(collection, responseText);
                        pm.collections.mergeCollection(collection, false);                        
                    }
                });
            }
            else {
                //Local drive file does not exist
                console.log("Add new");
                pm.drive.getFile(file, function(responseText) {
                    console.log("Obtained file from drive");
                    if (file.fileExtension === "postman_collection") {
                        var collection = JSON.parse(responseText);
                        console.log("Add to DB");
                        pm.collections.addCollectionDataToDB(collection, false);

                        var newLocalDriveFile = {
                            "id": collection.id,
                            "type": "collection",
                            "timestamp":new Date().getTime(),
                            "fileId": file.id,
                            "file": file
                        };

                        pm.indexedDB.driveFiles.addDriveFile(newLocalDriveFile, function(e) {
                            console.log("Uploaded file", newLocalDriveFile);                            
                            var currentTime = new Date().toISOString();
                            pm.settings.set("lastDriveChangeTime", currentTime);                
                        });   
                    }
                });
            }
        });
    },

    /**
     * Load the Drive API client.
     * @param {Function} callback Function to call when the client is loaded.
     */
    loadClient: function(callback) {
        gapi.client.load('drive', 'v2', pm.drive.handleClientLoad);
    },

    refreshAuth: function(callback) {

    },

    getChangeList: function(callback, startChangeId) {
        var retrievePageOfChanges = function(request, result) {
            request.execute(function(resp) {
                if ("items" in resp) {
                    result = result.concat(resp.items);      
                } 
              
                var nextPageToken = resp.nextPageToken;
                if (nextPageToken) {
                    request = gapi.client.drive.changes.list({
                      'pageToken': nextPageToken
                    });

                    pm.settings.set("driveStartChangeId", resp.largestChangeId);
                    retrievePageOfChanges(request, result);
                } else {
                    pm.settings.set("driveStartChangeId", resp.largestChangeId);                    
                    callback(result);
                }
            });
        }

        var initialRequest;
        if (startChangeId > 1) {
            console.log(startChangeId);
            initialRequest = gapi.client.drive.changes.list({
                'startChangeId' : startChangeId,
                'fields': 'nextPageToken,largestChangeId,items(fileId,deleted,file(id,title,fileExtension,modifiedDate,downloadUrl))'
            });
        } 
        else {
            initialRequest = gapi.client.drive.changes.list({
                'fields': 'nextPageToken,largestChangeId,items(fileId,deleted,file(id,title,fileExtension,modifiedDate,downloadUrl))' 
            });
        }

        retrievePageOfChanges(initialRequest, []);
    },

    /**
     * Check if the current user has authorized the application.
     */
    checkAuth: function(){
        gapi.auth.authorize(
        {
            'client_id': pm.drive.CLIENT_ID,
            'scope': pm.drive.SCOPES.join(' '),
            'immediate': true
        },

        pm.drive.handleAuthResult);
    },

    /**
     * Called when authorization server replies.
     *
     * @param {Object} authResult Authorization result.
     */
    handleAuthResult: function(authResult) {
        if (authResult) {
            pm.drive.auth = authResult;
            pm.drive.loadClient(pm.drive.handleClientLoad);
            console.log(authResult);
            // Access token has been successfully retrieved, requests can be sent to the API
        } else {
            // No access token could be retrieved, force the authorization flow.
            gapi.auth.authorize(
                {'client_id': pm.drive.CLIENT_ID, 'scope': pm.drive.SCOPES, 'immediate': false},
                pm.drive.handleAuthResult);
        }
    },

    createFolder: function(folderName, callback) {

    },

    queuePost: function(targetId, targetType, name, fileData, callback) {
        var change = {
            id: guid(),            
            fileData: fileData,
            method: "POST",
            name: name,
            targetId: targetId,
            targetType: targetType,
            timestamp: new Date().getTime()
        };

        pm.indexedDB.driveChanges.addDriveChange(change, function(change) {            
            console.log("Post change added");
            pm.drive.changes.push(change);
            pm.drive.runChangeQueue();
            callback();
        });
    },

    removeExistingUpdateIfPresent: function(targetId) {
        var changes = pm.drive.changes;
        var size = changes.length;
        var found = false;
        var changeId;
        for (var i = 0; i < size; i++) {
            var change = changes[i];

            if (change.method === "UPDATE" && change.targetId === targetId) {
                console.log("Duplicate found");
                console.log(pm.drive.changes);
                changeId = change.id;
                found = true;                
                break;
            }
        }

        if (found) {
            pm.drive.changes.splice(i, 1);
            console.log(pm.drive.changes);
            pm.indexedDB.driveChanges.deleteDriveChange(change.id, function(e) {
                console.log("Deleted existing drive change");
            });    
        }
        
        return found;        
    },

    queueUpdate: function(targetId, targetType, name, file, fileData, callback) {
        var change = {
            id: guid(),            
            fileData: fileData,
            file: file,
            method: "UPDATE",
            name: name,
            targetId: targetId,
            targetType: targetType,
            timestamp: new Date().getTime()
        };

        pm.drive.removeExistingUpdateIfPresent(targetId);                    
        pm.indexedDB.driveChanges.addDriveChange(change, function(change) {
            console.log("Update change added");
            pm.drive.changes.push(change);
            pm.drive.runChangeQueue();
            callback();
        });
    },

    queueTrash: function(targetId, targetType, file, callback) {
        var change = {
            id: guid(),            
            fileId: file.id,
            method: "TRASH",            
            targetId: targetId,
            targetType: targetType,
            timestamp: new Date().getTime()
        };

        pm.indexedDB.driveChanges.addDriveChange(change, function(change) {
            console.log("Trash change added");
            pm.drive.changes.push(change);
            pm.drive.runChangeQueue();
            callback();
        });
    },


    //Testing
    postFile: function(name, type, fileData, callback) {
        var boundary = '-------314159265358979323846';
        var delimiter = "\r\n--" + boundary + "\r\n";
        var close_delim = "\r\n--" + boundary + "--";

        var metadata = {
            'title': name,
            'mimeType': "application/json"
        };

        var multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                fileData +
                close_delim;

        var request = gapi.client.request({
            'path': '/upload/drive/v2/files',
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody});

        request.execute(function(e) {            
            if (callback) {
                callback(e);    
            }            
        });        
    },

    updateFile: function(name, file, fileData, callback) {
        var boundary = '-------314159265358979323846';
        var delimiter = "\r\n--" + boundary + "\r\n";
        var close_delim = "\r\n--" + boundary + "--";

        var metadata = {
            'title': name,
            'mimeType': "application/json",
            'useContentAsIndexableText': true,
            'newRevision': true
        };

        var multipartRequestBody =
            delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                fileData +
                close_delim;

        var request = gapi.client.request({
            'path': '/upload/drive/v2/files/' + file.id,
            'method': 'PUT',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody});

        request.execute(function(file) {            
            if (callback) {
                callback(file);    
            }
        });        
    },

    trashFile: function(fileId, callback) {        
        var request = gapi.client.drive.files.trash({
            'fileId': fileId
        });
        request.execute(function(resp) {
            callback();
        });
    },

    getFile: function(file, callback) {
        if (file.downloadUrl) {
            var accessToken = gapi.auth.getToken().access_token;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', file.downloadUrl);
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            xhr.onload = function() {
              callback(xhr.responseText);
            };
            xhr.onerror = function() {
              callback(null);
            };
            xhr.send();
        } else {
            callback(null);
      }
    },

    collections: {
        checkIfCollectionIsOnDrive: function(id, callback) {
            pm.indexedDB.driveFiles.getDriveFile(id, function(driveFile) {
                if (driveFile) {
                    console.log("Collection found");
                    callback(true, driveFile);
                }
                else {
                    console.log("Collection not found");
                    callback(false);
                }
                
            });
        },

        queuePostFromCollection: function(collection) {
            if (!pm.drive.isSyncEnabled()) return;

            var id = collection.id;
            var name = collection.name + ".postman_collection";
            var filedata = JSON.stringify(collection);
            
            pm.drive.queuePost(id, "collection", name, filedata, function() {
                console.log("Uploaded new collection", name);                
            });            
        },

        queuePost: function(id) {
            if (!pm.drive.isSyncEnabled()) return;

            pm.collections.getCollectionData(id, function(name, type, filedata) {
                console.log(filedata);
                pm.drive.queuePost(id, "collection", name + ".postman_collection", filedata, function() {
                    console.log("Uploaded new collection", name);                
                });
            });
        },

        queueUpdateFromCollection: function(collection) {
            if (!pm.drive.isSyncEnabled()) return;

            var id = collection.id;
            var name = collection.name + ".postman_collection";
            var filedata = JSON.stringify(collection);

            pm.indexedDB.driveFiles.getDriveFile(id, function(driveFile) {
                pm.drive.queueUpdate(id, "collection", name + ".postman_collection", driveFile.file, filedata, function() {
                    console.log("Updated collection", collection.id);                
                });
            });
        },

        queueUpdateFromId: function(id) {
            if (!pm.drive.isSyncEnabled()) return;

            pm.collections.getCollectionDataForDrive(id, function(name, type, filedata) {                
                pm.indexedDB.driveFiles.getDriveFile(id, function(driveFile) {
                    pm.drive.queueUpdate(id, "collection", name, driveFile.file, filedata, function() {
                        console.log("Updated collection from id", id);                
                    });
                });                
            });
        },

        queueTrash: function(id) {
            if (!pm.drive.isSyncEnabled()) return;

            pm.drive.collections.checkIfCollectionIsOnDrive(id, function(exists, driveFile) {
                if (exists) {                
                    pm.drive.queueTrash(id, "collection", driveFile.file, function() {                    
                        console.log("Deleted collection", id);                    
                    });
                }
            });            
        }
    }
};