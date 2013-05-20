function handleClientLoad() {
    pm.drive.checkAuth();
}

pm.drive = {
    auth: {},
    about: {},
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

        pm.drive.isSyncing = true;

        pm.drive.onStartSyncing();


        //TODO Do not delete a driveChange if the request was not succesful
        if (method === "POST") {            
            pm.drive.postFile(name, type, fileData, function(file) {
                pm.drive.isSyncing = false;
                pm.drive.onFinishSyncing();

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
        else if (method === "DELETE") {
            pm.drive.deleteFile(fileId, function() {
                pm.drive.isSyncing = false;
                pm.drive.onFinishSyncing();

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
                pm.drive.isSyncing = false;
                pm.drive.onFinishSyncing();

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

        pm.drive.getAbout(function(about) {
            pm.drive.about = about;     
            pm.drive.updateUserStatus(about);

            pm.drive.onStartSyncing();

            pm.drive.getChangeList(function(changes) {
                //Show indicator here. Block UI changes with an option to skip
                //Changes is a collection of file objects
                pm.drive.isSyncing = false;

                pm.drive.onFinishSyncing();
                pm.drive.filterChangesFromDrive(changes);                               
            }, startChangeId);  
        });        
    },

    updateUserStatus: function(about) {        
        $("#user-status-text").html(about.name);
        var pictureUrl = about.user.picture.url;
        $("#user-img").html("<img src='" + pictureUrl + "' width='20px' height='20px'/>");
    },

    onStartSyncing: function() {
        $("#user-status-text").html("Syncing...");        
        //$("#user-img").html("<img src='img/ajax-loader.gif' width='20px' height='20px'/>");
    },

    onFinishSyncing: function() {
        if (pm.drive.about) {
            var about = pm.drive.about;
            $("#user-status-text").html(about.name);
        }        
    },

    filterChangesFromDrive: function(changes) {
        console.log("Changes are ", changes);
        var lastTime = new Date(pm.settings.get("lastDriveChangeTime"));

        if (!lastTime) {
            lastTime = 0;
        }

        /*
        For the initial filteredChanges:
        List all fileIds and if a duplicate is found then remove the last one
        */
        
        var size = changes.length;
        var change;

        var uniqueChanges = [];

        for(var i = 0; i < size; i++) {
            change = changes[i];
            var fileId = change.fileId;
            var deleted = change.deleted;

            
            var index = arrayObjectIndexOf(uniqueChanges, "fileId", fileId);

            if (index === -1) {
                uniqueChanges.push(change);
            }            
            else {
                console.log("Removing duplicate change");
                //Remove the existing change
                uniqueChanges.splice(index, 1);
                uniqueChanges.push(change);
            }
        }

        /*
        1. Get local changes if any
        2. If the timestamp of the local change is greater than the drive change
           for the same fileId then discard the drive API change
        3. If the timestamp of the drive change is greater then keep the change
        4. last change time would be stored as the last time uploaded on the server
        5. Implement filteredChanges
        6. If any local changes are still remaining, then push them on the server by calling runQueue           
        7. For same fileIds only one change will remain
        8. How to compare local drive change and drive API change without reading the contents of the file? Use fileIds
        9. Only have to be concerned with updates and deletes
        10. POSTs will be created anyway
        11. DELETEing a non-exist 
        */        

        pm.indexedDB.driveChanges.getAllDriveChanges(function(localDriveChanges) {
            pm.drive.changes = localDriveChanges;

            console.log("Local drive changes are", localDriveChanges);

            var filteredChanges = []; //Only the latest ones
            var change;
            var size = uniqueChanges.length;
            var filteredLocalDriveChanges = [];

            if (localDriveChanges.length > 0) {                
                var localDriveChangesSize = localDriveChanges.length;
                for (var k = 0; k < localDriveChangesSize; k++) {
                    var localDriveChange = localDriveChanges[k];

                    if (localDriveChange.method === "UPDATE") {
                        var fileId = localDriveChange.fileId;                        
                        var existingDriveChange = _.find(uniqueChanges, function(c) {
                            if (c.fileId === fileId) return true;
                        });

                        if (existingDriveChange) {                            
                            var existingDriveModifiedDate = new Date(existingDriveChange.file.modifiedDate);
                            var localModifiedDate = new Date(localDriveChange.timestamp);

                            if (localModifiedDate.getTime() > existingDriveModifiedDate.getTime()) {
                                //The state of the file locally will be preferred
                                filteredLocalDriveChanges.push(localDriveChange);
                                var pos = arrayObjectIndexOf(uniqueChanges, fileId, "fileId");
                                console.log("MERGING: Preferring local drive change");
                                uniqueChanges.splice(pos, 1);
                            }
                            else {
                                //The drive state will be preferred
                                //Do not push
                                //Delete local change
                                pm.indexedDB.driveChanges.deleteDriveChange(localDriveChange.id, function(localDriveChangeId) {
                                    console.log("Deleted local drive change");
                                });
                            }
                        }
                    }
                    else {
                        filteredLocalDriveChanges.push(localDriveChange);
                    }
                }
            }

            for(var i = 0; i < size; i++) {
                change = uniqueChanges[i];

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

            pm.drive.implementFilteredChanges(filteredChanges, filteredLocalDriveChanges);
        });

        
    },

    implementFilteredChanges: function(changes, localDriveChanges) {
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

        if (localDriveChanges.length > 0) {
            console.log("Local changes remaining");
            pm.drive.changes = localDriveChanges;    
            pm.drive.runChangeQueue();
        }
        

    },    

    deleteDriveFile: function(fileId) {
        pm.indexedDB.driveFiles.getDriveFileByFileId(fileId, function(file) {            
            if (file) {
                var type = file.type;
                var id = file.id;

                if (type === "collection") {
                    pm.drive.collections.deleteLocalFromDrive(id);
                }    
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
                        pm.drive.collections.updateLocalFromDrive(responseText);         
                    }
                });
            }
            else {
                //Local drive file does not exist
                console.log("Add new");
                pm.drive.getFile(file, function(responseText) {
                    console.log("Obtained file from drive");
                    if (file.fileExtension === "postman_collection") {
                        pm.drive.collections.addLocalFromDrive(file, responseText);
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

    getAbout: function(callback) {
        var request = gapi.client.drive.about.get();
        request.execute(function(resp) {
            pm.drive.about = resp;            
            callback(resp);            
        });
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
                      'pageToken': nextPageToken,
                      'includeDeleted' : true,
                      'fields': 'nextPageToken,largestChangeId,items(fileId,deleted,file(id,title,fileExtension,modifiedDate,downloadUrl))'
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
                'includeDeleted' : true,
                'fields': 'nextPageToken,largestChangeId,items(fileId,deleted,file(id,title,fileExtension,modifiedDate,downloadUrl))'
            });
        } 
        else {
            initialRequest = gapi.client.drive.changes.list({
                'includeDeleted' : true,
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
            fileId: file.id,
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

    queueDelete: function(targetId, targetType, file, callback) {
        var change = {
            id: guid(),            
            fileId: file.id,
            method: "DELETE",            
            targetId: targetId,
            targetType: targetType,
            timestamp: new Date().getTime()
        };

        pm.indexedDB.driveChanges.addDriveChange(change, function(change) {
            console.log("Delete change added");
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

    deleteFile: function(fileId, callback) {        
        var request = gapi.client.drive.files.delete({
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
        },

        queueDelete: function(id) {
            if (!pm.drive.isSyncEnabled()) return;

            pm.drive.collections.checkIfCollectionIsOnDrive(id, function(exists, driveFile) {
                if (exists) {                
                    pm.drive.queueDelete(id, "collection", driveFile.file, function() {                    
                        console.log("Deleted collection", id);                    
                    });
                }
            });            
        },

        updateLocalFromDrive: function(responseText) {
            var collection = JSON.parse(responseText);
            console.log(collection, responseText);
            pm.collections.mergeCollection(collection, false);
        },


        deleteLocalFromDrive: function(id) {
            pm.collections.deleteCollection(id, false);
            pm.indexedDB.driveFiles.deleteDriveFile(id, function() {                        
            });
        },

        addLocalFromDrive: function(file, responseText) {
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

    }
};