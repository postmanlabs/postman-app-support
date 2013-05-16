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

    isSyncing: false,
    isQueueRunning: false,

    init: function() {
        //Show drive dialog for the first time user
        //Start drive authentication flow only after the user says yes
        //Do not pester every time        
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
                    "file": file
                };

                pm.indexedDB.driveFiles.addDriveFile(localDriveFile, function(e) {
                    console.log("Uploaded file", e);
                    //Remove the change inside driveChange
                    pm.indexedDB.driveChanges.deleteDriveChange(changeId, function(e) {
                        console.log("Removed drive change", e);                        
                    });

                    pm.drive.runChangeQueue();
                });                
                
            });
        }
        else if (method === "TRASH") {
            pm.drive.trashFile(fileId, function() {
                pm.indexedDB.driveFiles.deleteDriveFile(changeTargetId, function() {
                    console.log("Deleted local file");

                    //Remove the change inside driveChange
                    pm.indexedDB.driveChanges.deleteDriveChange(changeId, function(e) {
                        console.log("Removed drive change", e);
                        //Call runQueue again                        
                    });                      

                    pm.drive.runChangeQueue();          
                });
            });
        }
        else if (method === "UPDATE") {            
            pm.drive.updateFile(name, file, fileData, function(updatedFile) {
                var updatedLocalDriveFile = {
                    "id": changeTargetId,
                    "type": changeTargetType,
                    "timestamp":new Date().getTime(),
                    "file": updatedFile
                };

                pm.indexedDB.driveFiles.updateDriveFile(updatedLocalDriveFile, function() {
                    //Remove the change inside driveChange
                    pm.indexedDB.driveChanges.deleteDriveChange(changeId, function(e) {
                        console.log("Removed drive change", e);
                        //Call runQueue again                        
                    });                      

                    pm.drive.runChangeQueue();              
                });                
            });            
        }
    },

    //Executes all changes one by one
    runChangeQueue: function() {
        console.log("Run change queue called");
        pm.indexedDB.driveChanges.getAllDriveChanges(function(changes) {            
            console.log("Changes are", changes);
            if (changes.length > 0) {
                pm.drive.executeChange(changes[0]);    
            }
            else {
                pm.drive.isQueueRunning = false;
            }
            
        });
    },

    /**
     * Called when the client library is loaded.
     */
    handleClientLoad: function() {
        console.log("Client has loaded");    
        pm.drive.isSyncing = true;
        pm.drive.getChangeList(function(changes) {
            //Show indicator here. Block UI changes with an option to skip
            //Changes is a collection of file objects
            pm.drive.isSyncing = false;
            console.log("Received changes", changes);
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
              result = result.concat(resp.items);
              var nextPageToken = resp.nextPageToken;
              if (nextPageToken) {
                request = gapi.client.drive.changes.list({
                  'pageToken': nextPageToken
                });
                retrievePageOfChanges(request, result);
              } else {
                callback(result);
              }
            });
        }

        var initialRequest;
        if (startChangeId) {
            initialRequest = gapi.client.drive.changes.list({
                'startChangeId' : startChangeId,
                'fields': 'nextPageToken,largestChangeId,items(fileId,deleted,file(id,title,fileExtension,modifiedDate))'
            });
        } 
        else {
            initialRequest = gapi.client.drive.changes.list({
                'fields': 'nextPageToken,largestChangeId,items(fileId,deleted,file(id,title,fileExtension,modifiedDate))' 
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

    post: function(targetId, targetType, name, fileData, callback) {
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
            console.log("Change added", change);
            pm.drive.runChangeQueue();
            callback();
        });
    },

    update: function(targetId, targetType, name, file, fileData, callback) {
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

        pm.indexedDB.driveChanges.addDriveChange(change, function(change) {
            console.log("Change added", change);
            pm.drive.runChangeQueue();
            callback();
        });
    },

    trash: function(targetId, targetType, file, callback) {
        var change = {
            id: guid(),            
            fileId: file.id,
            method: "TRASH",            
            targetId: targetId,
            targetType: targetType,
            timestamp: new Date().getTime()
        };

        pm.indexedDB.driveChanges.addDriveChange(change, function(change) {
            console.log("Change added", change);
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
            console.log(e);

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
        console.log(fileId);
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
    }
};