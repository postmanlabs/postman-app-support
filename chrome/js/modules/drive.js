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

    isQueueRunning: false,

    init: function() {
        //Show drive dialog for the first time user
        //Start drive authentication flow only after the user says yes
        //Do not pester every time
    },

    executeChange: function(change) {
        pm.drive.isQueueRunning = true;


    },

    //Executes all changes one by one
    implementChanges: function() {
        pm.indexedDB.driveChanges.getAllDriveChanges(function(changes) {            
            if (changes.length > 0 && pm.drive.isQueueRunning === false) {
                pm.drive.executeChange(changes[0]);    
            }
            
        });
    },

    /**
     * Called when the client library is loaded.
     */
    handleClientLoad: function() {
        console.log("Client has loaded");    
        pm.drive.getChangeList(function(changes) {
            //Show indicator here. Block UI changes with an option to skip
            //Changes is a collection of file objects
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

    //Testing
    postFile: function(name, type, filedata, callback) {
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
                filedata +
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

    updateFile: function(name, file, filedata, callback) {
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
                filedata +
                close_delim;

        var request = gapi.client.request({
            'path': '/upload/drive/v2/files/' + file.id,
            'method': 'PUT',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody});

        request.execute(function(e) {
            console.log(e);
            if (callback) {
                callback();    
            }
        });        
    },

    trashFile: function(file, callback) {
        console.log(file.id);
        var request = gapi.client.drive.files.trash({
            'fileId': file.id
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