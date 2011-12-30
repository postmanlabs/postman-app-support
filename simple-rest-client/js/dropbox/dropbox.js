/*
 *  Dropbox Javascript library v1.1                                           *
 *  Copyright Luis Gonzalez 2010                                              *
 *	                                                                          *
 *  Requires jQuery 1.4.1 or newer (included in source)                       *
 *  	 																	  *
 *	Based on Dropbox Javascript library v1.0 by Peter Joslin			      *
 *  http://code.google.com/p/dropbox-js/									  *
 *                                                                            *
 *  Uses the Javascript OAuth library by John Kristian                        *
 *  http://oauth.googlecode.com/svn/code/javascript/                          *
 *	                                                                          *
 *  Also uses SHA1.js by Paul Johnston	                                      *
 *  http://pajhome.org.uk/crypt/md5/	                                      *
 *	                                                                          *
 *	                                                                          *
 *  Licensed under the Apache License, Version 2.0 (the "License");           *
 *  you may not use this file except in compliance with the License.          *
 *  You may obtain a copy of the License at                                   *
 *	                                                                          *
 *     http://www.apache.org/licenses/LICENSE-2.0                             *
 *	                                                                          *
 *  Unless required by applicable law or agreed to in writing, software       *
 *  distributed under the License is distributed on an "AS IS" BASIS,         *
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 *  See the License for the specific language governing permissions and       *
 *  limitations under the License.                                            */

var dropbox = {};


//Change to your own Dropbox API keys
dropbox.consumerKey = "9a3t6ah2b9198ox";
dropbox.consumerSecret = "pt9txtw6p2l7e52";

//Prefix for data storate - MUST be unique
dropbox.prefix = "postman_";

//Set to "dropbox" if your application has been given full Dropbox folder access
dropbox.accessType = "sandbox";

//Change the below line to true to use HTML5 local storage instead of cookies
dropbox.authHTML5 = true;

//Set to false to disable file metadata caching
dropbox.cache = true;

//Set this to your authorization callback URL
dropbox.authCallback = "";

//Maximum number of files to list from a directory. Default 10k
dropbox.fileLimit = 10000;

//Cookie expire time (in days). Default 10 years
dropbox.cookieTime = 3650;

dropbox.afterAuthentication = false;

/*-------------------No editing required beneath this line-------------------*/

//if redirected from dropbox, store the access token.
var urlVars = getUrlVars(document.URL, true);
if(urlVars["oauth_token"]) {
    localStorage.setItem(dropbox.prefix + "accessToken", urlVars["oauth_token"]);
    dropbox.afterAuthentication = true;
}

//If using HTML5 local storage
if (dropbox.authHTML5 == true) {
    //Get tokens (only declares variables if the token exists)
    temp = localStorage.getItem(dropbox.prefix + "requestToken")
    if (temp) {
        dropbox.requestToken = temp;
    }

    temp = localStorage.getItem(dropbox.prefix + "requestTokenSecret")
    if (temp) {
        dropbox.requestTokenSecret = temp;
    }

    temp = localStorage.getItem(dropbox.prefix + "accessToken")
    if (temp) {
        dropbox.accessToken = temp;
    }

    temp = localStorage.getItem(dropbox.prefix + "accessTokenSecret")
    if (temp) {
        dropbox.accessTokenSecret = temp;
    }
} else {
    //Get cookies (for stored OAuth tokens)
    cookies = document.cookie;
    cookies = cookies.split(";");

    //Loop through cookies to extract tokens
    for (i in cookies) {
        c = cookies[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        c = c.split("=");
        switch (c[0]) {
            case dropbox.prefix + "requestToken":
                dropbox.requestToken = c[1];
                break;

            case dropbox.prefix + "requestTokenSecret":
                dropbox.requestTokenSecret = c[1];
                break;

            case dropbox.prefix + "accessToken":
                dropbox.accessToken = c[1];
                break;

            case dropbox.prefix + "accessTokenSecret":
                dropbox.accessTokenSecret = c[1];
                break;
        }
    }

    //While we're here, set the cookie expiry date (for later use)
    dropbox.cookieExpire = new Date();
    dropbox.cookieExpire.setDate(dropbox.cookieExpire.getDate() + dropbox.cookieTime);
    dropbox.cookieExpire = dropbox.cookieExpire.toUTCString();
}


dropbox.init = function (cKey, cSecret) {
    dropbox.consumerKey = cKey;
    dropbox.consumerSecret = cSecret;
}


dropbox.authorizeUser = function () {
    //also open a new tab which links to the authorize page.
    window.location = 'https://www.dropbox.com/1/oauth/authorize?oauth_token=' + dropbox.getData("requestToken") + '&oauth_callback=' + document.URL
};


dropbox.login_v1 = function (callback) {
    if (dropbox.isLoggedin()) {
        return true;
    }
    //get the Request Token

    dropbox.oauthRequest({
        url:"https://api.dropbox.com/1/oauth/request_token",
        method:"POST"
    }, [], function storeToken(data) {
        var pairs = getUrlVars(data, true);
        dropbox.storeData("requestToken", pairs["oauth_token"]);
        dropbox.storeData("requestTokenSecret", pairs["oauth_token_secret"]);
        dropbox.requestToken = pairs["oauth_token"];
        dropbox.requestTokenSecret = pairs["oauth_token_secret"];
        dropbox.authorizeUser();
    });
}

// User's email and password should NEVER be stored.
// Token request must be called only _once_ with user's email and password and the token keeped around for later calls.
dropbox.login = function (userEmail, userPassword, cKey, cSecret) {
    dropbox.consumerKey = cKey;
    dropbox.consumerSecret = cSecret;
    var accessToken = dropbox.getData("accessToken");
    if (accessToken == "null" || accessToken == "undefined") {
        var url = "https://api.dropbox.com/1/oauth/request_token?" +
            "email=" + userEmail + "&" +
            "password=" + userPassword + "&" +
            "oauth_signature_method=HMAC-SHA1&" +
            "oauth_consumer_key=" + dropbox.consumerKey + "&" +
            "oauth_timestamp=" + OAuth.timestamp() + "&" +
            "oauth_consumer_secret=" + dropbox.consumerSecret;
        /*
         $.getJSON(url+"&callback=?", function(data, textStatus, xhr){
         dropbox.storeData("accessToken", data.token);
         dropbox.storeData("accessTokenSecret", data.secret);
         dropbox.accessToken = data.token;
         dropbox.accessTokenSecret = data.secret;
         console.log("logged ok");
         loadHandler();
         });
         */

        var jsonFeed = url + "&callback=?";
        $.ajax({
            url:jsonFeed,
            dataType:"json",
            type:"get",
            async:true,
            global:false,
            timeout:5000,
            complete:function () {
                console.log("complete");
            },
            success:function (data, status) {
                $("#info").show();
                $("#loader").hide();
                dropbox.storeData("accessToken", data.token);
                dropbox.storeData("accessTokenSecret", data.secret);
                dropbox.accessToken = data.token;
                dropbox.accessTokenSecret = data.secret;
                loadHandler();

            },
            error:function (XHR, textStatus, errorThrown) {
                $("#alts").show();
                $("#form").show();
                $("#error").show();
                $("#error").html(XHR.responseText);
                $("#loader").hide();
            }
        });

    }
}

//Delete accessToken 
dropbox.logout = function () {
    localStorage.removeItem(dropbox.prefix + "accessToken");
    localStorage.removeItem(dropbox.prefix + "accessTokenSecret");
}

dropbox.isLoggedin = function () {
    return (localStorage.getItem(dropbox.prefix + "accessToken") != null);
}

//Function to send oauth requests
dropbox.oauthRequest = function (param1, param2, callback) {

    //If the token wasn't defined in the function call, then use the access token
    if (!param1.token) {
        param1.token = dropbox.accessToken;
        /*if (!ignoreToken && dropbox.accessToken != undefined) {
            param1.token = dropbox.accessToken;
        }*/
    }
    /*if (!param1.tokenSecret) {
        if (dropbox.accessTokenSecret != undefined) {
            param1.tokenSecret = dropbox.accessTokenSecret;
        }
    }*/

    /*
    if (!param1.type) {
        param1.type = "json";
    }*/

    //If method isn't defined, assume it's GET
    if (!param1.method) {
        param1.method = "GET";
    }

    /*
    if (!param1.dataType) {
        param1.dataType = "script";
    }*/

    /*
    if (!param1.contentType) {
        param1.contentType = "jsonp";
    }*/

    //Define the accessor
    accessor = {
        consumerSecret:dropbox.consumerSecret
    };

    //Outline the message
    message = {
        action:param1.url,
        method:param1.method,
        parameters:[
            ["oauth_consumer_key", dropbox.consumerKey],
            ["oauth_signature_method", "PLAINTEXT"]
        ]
    };

    //Only add tokens to the request if they're wanted (vars not passed as true)
    if (param1.token != undefined && param1.token != true) {
        message.parameters.push(["oauth_token", param1.token]);
        //message.parameters.push(["oauth_token_secret", param1.tokenSecret]);
    }
    /*
    if (param1.tokenSecret != undefined && param1.tokenSecret != true) {
        accessor.tokenSecret = param1.tokenSecret;
    }*/

    //If given, append request-specific parameters to the OAuth request
    for (i in param2) {
        message.parameters.push(param2[i]);
    }

    //Callback function for jsonp requests
    //Should be appended to request url. Using $ajax parameter 'callback' does not work here
    /*if (callback != null) {
     message.parameters.push(["callback", callback]);
     }*/

    //Timestamp and sign the OAuth request
    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);


    /*$.post(message.action, OAuth.getParameterMap(message.parameters), function (data) {
        callback(data);
    });*/

    $.ajax({
        url:message.action,
        type:message.method,
        data:OAuth.getParameterMap(message.parameters),

        success:function (data) {
            //OAuth request successful - run callback
            callback(data);
        },

        error:function (a, b, c) {
            //Something went wrong. Feel free to add a better error message if you want
            console.log(b);
        }
    });
}

//Function to store data (tokens/cache) using either cookies or HTML5, depending on choice
dropbox.storeData = function (name, data) {
    //Escape data to be saved
    data = escape(data);

    //If using HTML5 local storage mode
    if (dropbox.authHTML5 == true) {
        localStorage.setItem(dropbox.prefix + name, data);
    } else {
        //Store data in cookie
        document.cookie = dropbox.prefix + name + "=" + data + "; expires=" + dropbox.cookieExpire + "; path=/";
    }
}

//Function to get data (tokens/cache) using either cookies or HTML5, depending on choice
dropbox.getData = function (name) {
    //If using HTML5 local storage mode
    if (dropbox.authHTML5 == true) {
        return unescape(localStorage.getItem(dropbox.prefix + name));
    } else {
        //Get cookies
        cookies = document.cookie;
        cookies = cookies.split(";");

        //Loop through cookies to find the right one
        for (i in cookies) {
            c = cookies[i];
            while (c.charAt(0) == ' ') c = c.substring(1);
            c = c.split("=");
            if (c[0] == dropbox.prefix + name) {
                return unescape(c[1]);
            }
        }
    }
}

/*    PUBLIC FUNCTIONS    */

//Function to get account info of user
dropbox.getAccount = function (callback) {
    dropbox.oauthRequest({
        url:"https://api.dropbox.com/1/account/info"
    }, [], callback);
}

//Function to get file/folder metadata
dropbox.getMetadata = function (path, callback) {
    dropbox.oauthRequest({
        url:"https://api.dropbox.com/0/metadata/" + dropbox.accessType + "/" + path
    }, [
        ["list", "false"]
    ], callback);
}

//Function to get a list of the contents of a directory
dropbox.getFolderContents = function (path, callback) {
    //If caching is enabled, get the hash of the requested folder
    if (dropbox.cache == true) {
        //Get cached data
        hash = dropbox.getData("cache." + path);

        //If cached data exists
        if (hash != "null") {
            //Parse the cached data and extract the hash
            hash = jQuery.parseJSON(hash).hash;
        } else {
            //Set to a blank hash
            hash = "00000000000000000000000000000000";
        }
    } else {
        //Set to a blank hash
        hash = "00000000000000000000000000000000";
    }

    //Send the OAuth request
    dropbox.oauthRequest({
        url:"https://api.dropbox.com/0/metadata/" + dropbox.accessType + "/" + path,
        type:"text"
    }, [
        ["list", "true"],
        ["status_in_response", "true"],
        ["hash", hash]

    ], callback);
}

//Function to get the contents of a file
dropbox.getFile = function (path, callback) {
    dropbox.oauthRequest({
        url:"https://api-content.dropbox.com/0/files/" + dropbox.accessType + "/" + path
    }, [], callback);
}

//Function to upload a file
dropbox.uploadFile = function (path, file, callback) {
    dropbox.oauthRequest({
        url:"https://api-content.dropbox.com/0/files/" + dropbox.accessType + "/" + path,
        type:"text"
    }, [
        ["file", file]
    ], callback);
}

//Function to move a file/folder to a new location
dropbox.moveFile = function (from, to, callback) {
    dropbox.oauthRequest({
        url:"https://api.dropbox.com/0/fileops/move"
    }, [
        ["from_path", from],
        ["to_path", to],
        ["root", dropbox.accessType]
    ], callback);
}

//Function to copy a file/folder to a new location
dropbox.copyItem = function (from, to, callback) {
    dropbox.oauthRequest({
        url:"https://api.dropbox.com/0/fileops/copy"
    }, [
        ["from_path", from],
        ["to_path", to],
        ["root", dropbox.accessType]
    ], callback);
}

//Function to delete a file/folder
dropbox.deleteItem = function (path, callback) {
    dropbox.oauthRequest({
        url:"https://api.dropbox.com/0/fileops/delete"
    }, [
        ["path", path],
        ["root", dropbox.accessType]
    ], callback);
}

//Function to delete a file/folder
dropbox.createFolder = function (path, callback) {
    dropbox.oauthRequest({
        url:"https://api.dropbox.com/0/fileops/create_folder"
    }, [
        ["path", path],
        ["root", dropbox.accessType]
    ], callback);
}

//Function to get a thumbnail for an image
dropbox.getThumbnail = function (path, size) {
    //Check 'size' parameter is valid
    if (size != "small" && size != "medium" && size != "large") size = "small";

    //Send OAuth request
    dropbox.oauthRequest({
        url:escape("https://api-content.dropbox.com/0/thumbnails/" + dropbox.accessType + "/" + path),
        type:"text"
    }, [
        ["size", size]
    ], callback);
}

