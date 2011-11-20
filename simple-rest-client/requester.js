/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */
// Status codes as per rfc2616
// @see http://tools.ietf.org/html/rfc2616#section-10
var statusCodes = new Array();
// Informational 1xx
statusCodes[100] = 'Continue';
statusCodes[101] = 'Switching Protocols';
// Successful 2xx
statusCodes[200] = 'OK';
statusCodes[201] = 'Created';
statusCodes[202] = 'Accepted';
statusCodes[203] = 'Non-Authoritative Information';
statusCodes[204] = 'No Content';
statusCodes[205] = 'Reset Content';
statusCodes[206] = 'Partial Content';
// Redirection 3xx
statusCodes[300] = 'Multiple Choices';
statusCodes[301] = 'Moved Permanently';
statusCodes[302] = 'Found';
statusCodes[303] = 'See Other';
statusCodes[304] = 'Not Modified';
statusCodes[305] = 'Use Proxy';
statusCodes[307] = 'Temporary Redirect';
// Client Error 4xx
statusCodes[400] = 'Bad Request';
statusCodes[401] = 'Unauthorized';
statusCodes[402] = 'Payment Required';
statusCodes[403] = 'Forbidden';
statusCodes[404] = 'Not Found';
statusCodes[405] = 'Method Not Allowed';
statusCodes[406] = 'Not Acceptable';
statusCodes[407] = 'Proxy Authentication Required';
statusCodes[408] = 'Request Time-out';
statusCodes[409] = 'Conflict';
statusCodes[410] = 'Gone';
statusCodes[411] = 'Length Required';
statusCodes[412] = 'Precondition Failed';
statusCodes[413] = 'Request Entity Too Large';
statusCodes[414] = 'Request-URI Too Long';
statusCodes[415] = 'Unsupported Media Type';
statusCodes[416] = 'Requested range not satisfiable';
statusCodes[417] = 'Expectation Failed';
// Server Error 5xx
statusCodes[500] = 'Internal Server Error';
statusCodes[501] = 'Not Implemented';
statusCodes[502] = 'Bad Gateway';
statusCodes[503] = 'Service Unavailable';
statusCodes[504] = 'Gateway Time-out';
statusCodes[505] = 'HTTP Version not supported';

var requests;
var bodyFileData;
var dataMode = "params";
var requestStartTime = 0;
var requestEndTime = 0;
var requestMethod = 'GET';
var dataInputType = "text";
var availableUrls = [];
var currentSidebarSection = "history";
var currentResponse;

var postman = {};
postman.history = {};
postman.history.requests = [];
postman.indexedDB = {};
postman.indexedDB.db = null;

// IndexedDB implementations still use API prefixes
var indexedDB = window.indexedDB || // Use the standard DB API
    window.mozIndexedDB || // Or Firefox's early version of it
    window.webkitIndexedDB;            // Or Chrome's early version
// Firefox does not prefix these two:
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
var IDBCursor = window.IDBCursor || window.webkitIDBCursor;

var socialButtons = {
    "facebook": '<iframe src="http://www.facebook.com/plugins/like.php?href=https%3A%2F%2Fchrome.google.com%2Fwebstore%2Fdetail%2Ffofkknmmmfkaddpcncigehnadkalmhhj&amp;send=false&amp;layout=button_count&amp;width=250&amp;show_faces=true&amp;action=like&amp;colorscheme=light&amp;font&amp;height=21&amp;appId=26438002524" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:250px; height:21px;" allowTransparency="true"></iframe>',
    "twitter": '<a href="https://twitter.com/share" class="twitter-share-button" data-url="https://chrome.google.com/webstore/detail/fofkknmmmfkaddpcncigehnadkalmhhj" data-text="I am using Postman to kick some API ass!" data-count="horizontal" data-via="a85">Tweet</a><script type="text/javascript" src="http://platform.twitter.com/widgets.js"></script>',
    "plusOne": '<script type="text/javascript" src="https://apis.google.com/js/plusone.js"></script><g:plusone size="medium" href="https://chrome.google.com/webstore/detail/fofkknmmmfkaddpcncigehnadkalmhhj"></g:plusone>'
};

function Collection() {
    this.id = "";
    this.name = "";
    this.customVars = {};
    this.requests = {};
}

function CollectionRequest() {
    this.collectionId = "";
    this.id = "";
    this.url = "";
    this.method = "";
    this.headers = "";
    this.data = "";
    this.dataMode = "params";
    this.timestamp = 0;
}

function Request() {
    this.id = "";
    this.url = "";
    this.method = "";
    this.headers = "";
    this.data = "";
    this.dataMode = "params";
    this.timestamp = 0;
}

function Response() {
    this.id = "";
    this.headers = "";
    this.text = "";
}

function clearFields() {
    $("#response").css("display", "");
    $("#loader").css("display", "");
    $("#responsePrint").css("display", "none");

    $("#responseStatus").html("");
    $("#responseHeaders").val("");
    $("#codeData").text("");

    $("#respHeaders").css("display", "none");
    $("#respData").css("display", "none");

    $('#codeData').attr('data-formatted', 'false');
}

function limitStringLineWidth(string, numChars) {
    var remainingChars = string;
    var finalString = "";
    numLeft = string.length;
    do {
        finalString += remainingChars.substr(0, numChars);
        remainingChars = remainingChars.substr(numChars);
        numLeft -= numChars;
        if (numLeft < 5) {
            numLeft -= numChars;
            finalString += remainingChars.substr(0, numChars)
        }
        else {
            finalString += "<br/>";
        }
    } while (numLeft > 0);

    return finalString;
}

function getRequestMethod() {
    return requestMethod;
}

function setRequestMethod(m) {
    requestMethod = m;
}

function sendRequest() {
    if ($("#url").val() != "") {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = readResponse;
        try {
            var headers = $("#headers").val();
            var url = $("#url").val();
            var method = getRequestMethod();

            var data = "";
            var bodyData = "";

            xhr.open(method, $("#url").val(), true);

            headers = headers.split("\n");
            for (var i = 0; i < headers.length; i++) {
                var header = headers[i].split(": ");
                if (header[1]) {
                    xhr.setRequestHeader(header[0], header[1]);
                }

            }

            if (jQuery.inArray(method, ["post", "put"]) > -1) {
                if (dataMode === 'raw') {
                    data = $("#body").val();
                    bodyData = data;
                }
                else if (dataMode === 'params') {
                    bodyData = new FormData();

                    //Iterate through all key/values

                    $('input[data-section=body]').each(function() {
                        var valueEl = $(this).next();
                        var type = valueEl.attr('type');

                        if ($(this).val() !== '') {
                            if (type === 'file') {
                                var domEl = $(this).next().get(0);
                                var len = domEl.files.length;
                                for (var i = 0; i < len; i++) {
                                    bodyData.append($(this).val(), domEl.files[i]);
                                }
                            }
                            else {
                                bodyData.append($(this).val(), valueEl.val());
                            }
                        }
                    });

                    data = $('#body').val();
                }

                //Check if a file is being sent
                xhr.send(bodyData);
            } else {
                xhr.send();
            }

            requestStartTime = new Date().getTime();

            saveRequest(url, method, $("#headers").val(), data, dataMode);

            $('#submitRequest').button("loading");
        }
        catch(e) {
            console.log(e);
            $("#responseStatus").html("<span style=\"color:#FF0000\">" + chrome.i18n.getMessage("bad_request") + "</span>");
            $("#respHeaders").css("display", "none");
            $("#respData").css("display", "none");

            $("#loader").css("display", "none");
            $("#responsePrint").css("display", "");
        }
    } else {
        console.log("no uri");
        $("#responseStatus").html("<span style=\"color:#FF0000\">" + chrome.i18n.getMessage("bad_request") + "</span>");
        $("#respHeaders").css("display", "none");
        $("#respData").css("display", "none");

        $("#loader").css("display", "none");
        $("#responsePrint").css("display", "");
    }

    clearFields();
}

function readResponse() {
    currentResponse = new Response();

    $('#submitRequest').button("reset");

    $('#responseStatus').css("display", "block");
    $('#responseHeaders').css("display", "block");
    $('#codeData').css("display", "block");

    if (this.readyState == 4) {
        try {
            if (this.status == 0) {
                throw('Status = 0');
            }
            $("#responseStatus").html(this.status + ' ' + statusCodes[this.status]);
            $("#responseHeaders").val(jQuery.trim(this.getAllResponseHeaders()));

            var debugurl = /X-Debug-URL: (.*)/i.exec($("#responseHeaders").val());
            if (debugurl) {
                $("#debugLink").attr('href', debugurl[1]).html(debugurl[1]);
                $("#debugLinks").css("display", "");
            }

            var responseTextFormatted = jQuery.trim(this.responseText).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            $("#codeData").html(responseTextFormatted);

            currentResponse.text = responseTextFormatted;

            $("#respHeaders").css("display", "");
            $("#respData").css("display", "");

            $("#loader").css("display", "none");
            $("#responsePrint").css("display", "");

            requestEndTime = new Date().getTime();
            var diff = requestEndTime - requestStartTime;

            $('#ptime .data').html(diff + " ms");
            $('#pbodysize .data').html(diff + " bytes");

            //Set chili options according to the Content-Type header
            var contentType = this.getResponseHeader("Content-Type");

            var type = 'html';
            var format = 'html';

            if (contentType.search(/json/i) != -1) {
                type = 'json';
                format = 'javascript';
            }

            $('#language').val(format);
            setResponseFormat(format);
        }
        catch(e) {
            $("#responseStatus").html("No response.");
            $("#respHeaders").css("display", "none");
            $("#respData").css("display", "none");

            $("#loader").css("display", "none");
            $("#responsePrint").css("display", "");
        }
    }

    setContainerHeights();
    refreshScrollPanes();
}

//Manages showing/hiding the PUT/POST additional UI
function showRequestMethodUi(type) {
    if (jQuery.inArray(type, ["POST", "PUT"]) > -1) {
        $("#data").css("display", "");
        showBodyParamsEditor();
    } else {
        closeParamsEditor('body');
        $("#data").css("display", "none");
    }
}

function init() {
    $("#response").css("display", "none");
    $("#loader").css("display", "");
    $("#responsePrint").css("display", "none");
    $("#sep").css("display", "none");

    $("#data").css("display", "none");

    $("#responseStatus").html("");
    $("#respHeaders").css("display", "none");
    $("#respData").css("display", "none");

    $("#submitRequest").click(function() {
        sendRequest();
    });

    $('#langFormat').change(function() {
        var format = $('#language').val();
        setResponseFormat(format);
    })
}

function setupDB() {
    postman.indexedDB.onerror = function(event) {
        console.log(event);
    };
    
    postman.indexedDB.open = function() {
        var request = indexedDB.open("postman", "POSTman request history");
        request.onsuccess = function(e) {
            var v = "0.42";
            postman.indexedDB.db = e.target.result;
            var db = postman.indexedDB.db;

            console.log(db.version);
            
            //We can only create Object stores in a setVersion transaction
            if (v != db.version) {
                console.log(v, "Version is not the same");
                var setVrequest = db.setVersion(v);
                
                setVrequest.onfailure = function(e) {
                    console.log(e);
                };
                
                setVrequest.onsuccess = function(e) {
                    console.log(e);
                    if (db.objectStoreNames.contains("requests")) {
                        db.deleteObjectStore("requests");
                    }
                    if (db.objectStoreNames.contains("collections")) {
                        db.deleteObjectStore("collections");
                    }
                    if (db.objectStoreNames.contains("collection_requests")) {
                        db.deleteObjectStore("collection_requests");
                    }

                    var requestStore = db.createObjectStore("requests", {keyPath: "id"});
                    var collectionsStore = db.createObjectStore("collections", {keyPath: "id"});
                    var collectionRequestsStore = db.createObjectStore("collection_requests", {keyPath: "id"});

                    requestStore.createIndex("timestamp", "timestamp", { unique: false});
                    collectionsStore.createIndex("timestamp", "timestamp", { unique: false});

                    console.log("Final");
                    
                    collectionRequestsStore.createIndex("timestamp", "timestamp", { unique: false});
                    collectionRequestsStore.createIndex("collectionId", "collectionId", { unique: false});
                    
                    postman.indexedDB.getAllRequestItems();
                    postman.indexedDB.getCollections();
                };
            }
            else {
                postman.indexedDB.getAllRequestItems();
                postman.indexedDB.getCollections();
            }

        };

        request.onfailure = postman.indexedDB.onerror;
    };

    postman.indexedDB.addCollection = function(collection) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collections"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("collections");

        var request = store.put({
            "id": collection.id,
            "name": collection.name,
            "timestamp": new Date().getTime()
        });

        request.onsuccess = function(e) {
            console.log("Added collection to collection database", collection);
            postman.indexedDB.getCollections();
            postman.indexedDB.getAllRequestsInCollection(id);
        };

        request.onerror = function(e) {
            console.log(e.value);
        }
    };

    postman.indexedDB.addCollectionWithRequest = function(collection, collectionRequest) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collections"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("collections");

        var request = store.put({
            "id": collection.id,
            "name": collection.name
        });

        request.onsuccess = function(e) {
            collectionRequest.collectionId = collection.id;

            $('#itemCollectionSelectorList').tmpl([collection]).appendTo('#selectCollection');
            $('#itemCollectionSidebarHead').tmpl([collection]).appendTo('#collectionItems');

            addSidebarCollectionHeadListener(collection);
            refreshScrollPanes();

            postman.indexedDB.addCollectionRequest(collectionRequest, true);
        };

        request.onerror = function(e) {
            console.log(e.value);
        }
    }

    postman.indexedDB.addCollectionRequest = function(req, toRefreshSidebar) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collection_requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("collection_requests");

        var collectionRequest = store.put({
            "collectionId": req.collectionId,
            "id": req.id,
            "url": req.url.toString(),
            "method": req.method.toString(),
            "headers": req.headers.toString(),
            "data": req.data.toString(),
            "dataMode": req.dataMode.toString(),
            "timestamp": req.timestamp
        });

        collectionRequest.onsuccess = function(e) {
            var targetElement = "#collectionRequests-" + req.collectionId;
            addAvailableUrl(req.url);
            addUrlAutoComplete();

            req.url = limitStringLineWidth(req.url, 43);
            $('#itemCollectionSidebarRequest').tmpl([req]).appendTo(targetElement);
            addSidebarRequestListener(req);
            refreshScrollPanes();
        };

        collectionRequest.onerror = function(e) {
            console.log(e.value);
        }
    };

    postman.indexedDB.getCollections = function() {
        var db = postman.indexedDB.db;

        if(db == null) {
            console.log("Db is null");
            return;
        }

        $('#collectionItems').html("");
        $('#selectCollection').html("<option>Select</option>");

        var trans = db.transaction(["collections"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("collections");

        //Get everything in the store
        var keyRange = IDBKeyRange.lowerBound(0);
        var cursorRequest = store.openCursor(keyRange);

        cursorRequest.onsuccess = function(e) {
            var result = e.target.result;

            if (!!result == false) {
                return;
            }

            var collection = result.value;
            $('#itemCollectionSelectorList').tmpl([collection]).appendTo('#selectCollection');
            $('#itemCollectionSidebarHead').tmpl([collection]).appendTo('#collectionItems');
            refreshScrollPanes();

            postman.indexedDB.getAllRequestsInCollection(collection.id);
            //This wil call onsuccess again and again until no more request is left

            addSidebarCollectionHeadListener(collection);

            result.continue();
        };

        cursorRequest.onerror = function(e) {
            console.log(e);
        };
    };

    postman.indexedDB.getAllRequestsInCollection = function(id) {
        $('#collectionRequests-' + id).html("");
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collection_requests"], IDBTransaction.READ_WRITE);

        //Get everything in the store
        var keyRange = IDBKeyRange.only(id);
        var store = trans.objectStore("collection_requests");

        var index = store.index("collectionId");
        var cursorRequest = index.openCursor(keyRange);

        cursorRequest.onsuccess = function(e) {
            var result = e.target.result;

            if (!!result == false) {
                return;
            }

            var request = result.value;
            var targetElement = "#collectionRequests-" + request.collectionId;

            addAvailableUrl(request.url);
            addUrlAutoComplete();

            request.url = limitStringLineWidth(request.url, 40);
            $('#itemCollectionSidebarRequest').tmpl([request]).appendTo(targetElement);
            addSidebarRequestListener(request);
            refreshScrollPanes();

            //This wil call onsuccess again and again until no more request is left
            result.continue();
        };
        cursorRequest.onerror = postman.indexedDB.onerror;
    };

    postman.indexedDB.addRequest = function(id, url, method, headers, data, dataMode) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("requests");
        var historyRequest = {
            "id": id,
            "url": url.toString(),
            "method": method.toString(),
            "headers": headers.toString(),
            "data": data.toString(),
            "dataMode": dataMode.toString(),
            "timestamp": new Date().getTime()
        };

        var index = postman.history.requestExists(historyRequest);
        if(index >= 0) {
            var deletedId = postman.history.requests[index].id;
            postman.indexedDB.deleteRequest(deletedId);
            postman.history.requests.splice(index, 1);
        }

        var request = store.put(historyRequest);

        request.onsuccess = function(e) {
            //Re-render all the todos
            addAvailableUrl(url);
            addUrlAutoComplete();
            removeRequestFromSidebar(deletedId, false);
            renderRequestToSidebar(url,  method, id, "top");
            addSidebarRequestListener(historyRequest);
            postman.history.requests.push(historyRequest);
        };

        request.onerror = function(e) {
            console.log(e.value);
        }
    };

    postman.indexedDB.getRequest = function(id) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("requests");

        //Get everything in the store
        var cursorRequest = store.get(id);

        cursorRequest.onsuccess = function(e) {
            var result = e.target.result;
            if (!!result == false)
                return;

            loadRequestInEditor(result);
            return result;
        };
        cursorRequest.onerror = postman.indexedDB.onerror;
    };

    postman.indexedDB.getCollectionRequest = function(id) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collection_requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("collection_requests");

        //Get everything in the store
        var cursorRequest = store.get(id);

        cursorRequest.onsuccess = function(e) {
            var result = e.target.result;
            if (!!result == false)
                return;

            loadRequestInEditor(result);
            return result;
        };
        cursorRequest.onerror = postman.indexedDB.onerror;
    };

    postman.indexedDB.getAllRequestItems = function() {
        var db = postman.indexedDB.db;
        if(db == null) {
            return;
        }

        var trans = db.transaction(["requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("requests");

        //Get everything in the store
        var keyRange = IDBKeyRange.lowerBound(0);
        var index = store.index("timestamp");
        var cursorRequest = index.openCursor(keyRange);
        var historyRequests = [];
        
        cursorRequest.onsuccess = function(e) {
            var result = e.target.result;

            if (!!result == false) {
                for(var i = 0; i < historyRequests.length; i++) {
                    var r = historyRequests[i];
                    addAvailableUrl(r.url);
                    renderRequestToSidebar(r.url, r.method, r.id, "top");
                    addSidebarRequestListener(r);
                }

                addUrlAutoComplete();

                $('#historyItems').fadeIn();

                postman.history.requests = historyRequests;
                
                return;
            }

            var request = result.value;
            historyRequests.push(request);

            //This wil call onsuccess again and again until no more request is left
            result.continue();
        };

        cursorRequest.onerror = postman.indexedDB.onerror;
    };

    postman.indexedDB.deleteRequest = function(id) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["requests"], IDBTransaction.READ_WRITE, 0);
        var store = trans.objectStore(["requests"]);

        var request = store.delete(id);

        request.onsuccess = function(e) {
            removeRequestFromSidebar(id);
        };

        request.onerror = function(e) {
            console.log(e);
        };
    };

    postman.indexedDB.deleteCollectionRequest = function(id) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collection_requests"], IDBTransaction.READ_WRITE, 0);
        var store = trans.objectStore(["collection_requests"]);

        var request = store.delete(id);

        request.onsuccess = function(e) {
            removeRequestFromSidebar(id);
        };

        request.onerror = function(e) {
            console.log(e);
        };
    };

    postman.indexedDB.deleteAllCollectionRequests = function(id) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collection_requests"], IDBTransaction.READ_WRITE);

        //Get everything in the store
        var keyRange = IDBKeyRange.only(id);
        var store = trans.objectStore("collection_requests");

        var index = store.index("collectionId");
        var cursorRequest = index.openCursor(keyRange);

        cursorRequest.onsuccess = function(e) {
            var result = e.target.result;

            if (!!result == false) {
                return;
            }

            var request = result.value;
            postman.indexedDB.deleteCollectionRequest(request.id);
            result.continue();
        };
        cursorRequest.onerror = postman.indexedDB.onerror;
    };

    postman.indexedDB.deleteCollection = function(id) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collections"], IDBTransaction.READ_WRITE, 0);
        var store = trans.objectStore(["collections"]);

        var request = store.delete(id);

        request.onsuccess = function(e) {
            removeCollectionFromSidebar(id);
            removeCollectionFromSelector(id);
        };

        request.onerror = function(e) {
            console.log(e);
        };
    };
}


function initDB() {
    postman.indexedDB.open(); //Also displays the data previously saved
}

//History management functions
function saveRequest(url, method, headers, data, dataMode) {
    var id = guid();
    postman.indexedDB.addRequest(id, url, method, headers, data, dataMode);
}

function showEmptyHistoryMessage() {
    $('#emptyHistoryMessage').css("display", "block");
}

function hideEmptyHistoryMessage() {
    $('#emptyHistoryMessage').css("display", "none");
}

function renderRequestToSidebar(url, method, id, position) {
    url = limitStringLineWidth(url, 40);

    var request = {
        "url": url,
        "method": method,
        "id": id,
        "position": position
    };

    if (position === 'top') {
        $('#itemHistorySidebarRequest').tmpl([request]).prependTo('#historyItems');
    }
    else {
        $('#itemHistorySidebarRequest').tmpl([request]).appendTo('#historyItems');
    }
    refreshScrollPanes();
}

function removeRequestFromSidebar(id, toAnimate) {
    var historyRequests = postman.history.requests;
    var k = -1;
    for(var i = 0; i < historyRequests.length; i++) {
        if(historyRequests[i].id === id) {
            k = i;
            break;
        }
    }

    if(k >= 0) {
        postman.history.requests.splice(k, 1);
    }

    if(toAnimate) {
        $('#sidebarRequest-' + id).slideUp(100);
    }
    else {
        $('#sidebarRequest-' + id).remove();
    }

    refreshScrollPanes();
}

function removeCollectionFromSidebar(id) {
    $('#collection-' + id).slideUp(100);
    refreshScrollPanes();
}

function removeCollectionFromSelector(id) {
    var target = '#selectCollection option[value="' + id + '"]';
    $(target).remove();
}
function loadRequest(id) {
    postman.indexedDB.getRequest(id);
}

function loadCollectionRequest(id) {
    postman.indexedDB.getCollectionRequest(id);
}

function loadRequestInEditor(request) {
    var method = request.method.toLowerCase();
    
    $('#url').val(request.url);

    //Set proper class for method and the variable

    $('#headers').val(request.headers);
    $('#urlParamsEditor').css("display", "none");
    $('#response').css("display", "none");

    if (method === 'post' || method === 'put') {
        var dataMode = request.dataMode.toLowerCase();

        $('#data').css("display", "block");
        $('#body').val(request.data);
        $('#body').css("display", "block");

        $('#data .pills li').removeClass("active");
        if(dataMode == 'params') {
            $('#selector-container-params').addClass("active");
            showParamsEditor("body");
        }
        else if (dataMode == 'raw') {
            $('#selector-container-raw').addClass("active");
            closeParamsEditor("body");
        }
    }
    else {
        $('#body').val("")
        $('#data').css("display", "none");
        closeParamsEditor("body");
    }

    $('#methods ul li').removeClass('active');
    $('#method-' + method).parent().addClass('active');
    requestMethod = method;

    closeParamsEditor("url");
    clearResponse();

    $('body').scrollTop(0);
}

function clearResponse() {
    $('#responseStatus').css("display", "none");
    $('#responseHeaders').css("display", "none");
    $('#codeData').css("display", "none");
}

function deleteRequest(id) {
    postman.indexedDB.deleteRequest(id);
}

function deleteCollectionRequest(id) {
    postman.indexedDB.deleteCollectionRequest(id);
}

function deleteCollection(id) {
    postman.indexedDB.deleteCollection(id);
}

function lang() {
    $('._msg_').each(function () {
        var val = $(this).html();
        $(this).html(chrome.i18n.getMessage(val));
    });
    $('._msg_val_').each(function () {
        var val = $(this).val();
        $(this).val(chrome.i18n.getMessage(val));
    });
}

function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}
function guid() {
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function getUrlVars(url) {
    if (url === null) {
        return [];
    }

    var quesLocation = url.indexOf('?');
    var equalLocation = url.indexOf('=');

    if(equalLocation < 0) {
        return [];
    }

    if(quesLocation < 0) {
        quesLocation = -1;
    }

    var vars = [], hash;
    var hashes = url.slice(quesLocation + 1).split('&');
    var element;

    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        element = {
            "key": jQuery.trim(hash[0]),
            "value": jQuery.trim(hash[1])
        };

        vars.push(element);
    }

    return vars;
}

function getHeaderVars(data) {
    if (data === null || data === "") {
        return [];
    }

    var vars = [], hash;
    var hashes = data.split('\n');
    var header;

    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split(":");
        header = {
            "key": jQuery.trim(hash[0]),
            "value": jQuery.trim(hash[1])
        };

        vars.push(header);
    }

    return vars;
}

//Sets the param strings for header and url params
function setParamsFromEditor(section) {
    var paramString = "";

    $('input[data-section="' + section + '"]').each(function() {
        var val = $(this).next().val();
        if (val !== "" && $(this).val() !== "") {
            if (section !== 'headers') {
                paramString += $(this).val() + "=" + val + "&";
            }
            else {
                paramString += $(this).val() + ": " + val + "\n";
            }

        }
    });

    paramString = paramString.substr(0, paramString.length - 1);

    if (section === 'url') {
        var url = $('#url').val();
        var baseUrl = url.split("?")[0];
        $('#' + section).val(baseUrl + "?" + paramString);
    }
    else if (section === 'body') {
        $('#' + section).val(paramString);
    }
    else if (section === 'headers') {
        $('#' + section).val(paramString);
    }

}

function showParamsEditor(section, a1) {
    a1 = a1 || a1;
    var data = $('#' + section).val();

    var params;
    if (section === 'headers') {
        params = getHeaderVars(data);
    }
    else if(section === 'body') {
        params = getUrlVars(data);
    }
    else {
        params = getUrlVars(data);
    }

    var editorHtml = "";
    var i = 0;

    //@todo Replace this with jquery templates
    //@todo Remove for in

    var paramsLength = params.length;
    for (var index = 0; i < paramsLength; index++) {
        var element = params[index];
        var key = element.key;
        var value = element.value;

        editorHtml += "<div>";
        editorHtml += "<input type=\"text\" data-section=\"" + section + "\" name=\"" + section + "[key][]\" class=\"key\" placeholder=\"key\" value=\"" + key + "\"/>";
        editorHtml += "<input type=\"text\" name=\"" + section + "[value][]\" class=\"value\" placeholder=\"value\" value=\"" + value + "\"/>";
        if (section == 'body') {
            editorHtml += "<select><option value= \"text\">Text</option>";
            editorHtml += "<option value= \"file\">File</option></select>";
        }
        //editorHtml += "</div>";
        editorHtml += "<a href=\"javascript:void(0);\" class=\"deleteParam\" tabIndex=\"-1\">";
        editorHtml += "<img class=\"deleteButton\" src=\"images/delete.png\"/>";
        editorHtml += "</a>";
        editorHtml += "</div>";
        i++;
    }

    editorHtml += "<div>";
    editorHtml += "<input type=\"text\" data-section=\"" + section + "\" name=\"" + section + "[key][]\"";
    editorHtml += "class=\"key\" placeholder=\"key\"/>";
    editorHtml += "<input type=\"text\" name=\"" + section + "[value][]\"";
    editorHtml += "class=\"value\" placeholder=\"value\"/>";

    if (section == 'body') {
        editorHtml += "<select><option value= \"text\">Text</option>";
        editorHtml += "<option value= \"file\">File</option></select>";
    }

    editorHtml += "</div>";

    $('#' + section + '-ParamsFields').html(editorHtml);
    $('#' + section + '-ParamsEditor').fadeIn();

    addEditorListeners(section);
}

function deleteParam(section) {
    alert("To delete " + section + " param");
}

function closeParamsEditor(section) {
    $('#' + section + '-ParamsFields div:last input').unbind('focus');
    $('#' + section + '-ParamsFields input').unbind('blur');
    $('#' + section + '-ParamsEditor input.key').autocomplete("destroy");
    $('#' + section + '-ParamsEditor').css("display", "none");
}

function addParamInEditor(section) {
    var newElementHtml = "";
    newElementHtml += "<div>";
    newElementHtml += "<input type=\"text\" data-section=\"" + section + "\" name=\"" + section + "[key][]\" class=\"key\" placeholder=\"" + "key" + "\"/>";
    newElementHtml += "<input type=\"text\" name=\"" + section + "[value][]\" class=\"value\" placeholder=\"" + "value" + "\"/>";
    if (section == 'body') {
        newElementHtml += "<select><option value= \"text\">Text</option>";
        newElementHtml += "<option value= \"file\">File</option></select>";
    }
    newElementHtml += "</div>";
    $('#' + section + '-ParamsFields').append(newElementHtml);
    addEditorListeners(section);
}

function addFileParamInEditor(section) {
    if (section == 'body') {
        var containerHtml = "<div>";
        containerHtml += '<input type="text" data-section=\"" + section + "\" name="body[key][]" placeholder="key"/>';
        containerHtml += '<input type="file" data-section=\"" + section + "\" name="body[value][]" multiple/>';
        containerHtml += "<select><option value= \"text\">Text</option>";
        containerHtml += "<option value= \"file\">File</option></select>";
        containerHtml += "</div>";
        $('#' + section + '-ParamsFields').append(containerHtml);
        addEditorListeners(section);
    }
}

function changeParamInEditor(target) {
    if (target == "file") {

    }
}

function addHeaderListeners() {
}

function addBodyListeners() {
    $('#body').blur(function() {
        showParamsEditor('body');
    });
}

function removeBodyListeners() {
    $('#body').unbind("focus");
    $('#body').unbind("blur");
}

function setContainerHeights() {
    refreshScrollPanes();
}

function refreshScrollPanes() {
    var newMainWidth = $('#container').width() - $('#sidebar').width();
    $('#main').width(newMainWidth + "px");
    
    $('#sidebar').jScrollPane({
        mouseWheelSpeed: 24
    });
}

$(document).ready(function() {
    setupDB();
    initDB();
    lang();
    init();

    addHeaderListeners();
    addUrlAutoComplete();
    attachSidebarListeners();
    initCollectionSelector();
    setContainerHeights();

    refreshScrollPanes();
    
    $('#formAddToCollection').submit(function() {
        submitAddToCollectionForm();
        return false;
    });
    
    $('#methods ul li a').click(function() {
        $('#methods ul li').removeClass('active');
        $(this).parent().addClass('active');
        requestMethod = $(this).attr('data-method');
    });

    $(window).resize(function() {
        setContainerHeights();
    });
});

function addSidebarCollectionHeadListener(collection) {
    var targetElement = '#collection-' + collection.id + " .sidebar-collection-head";
    $(targetElement).mouseenter(function() {
        var actionsEl = jQuery('.collection-head-actions', this);
        actionsEl.css('display', 'block');
    });

    $(targetElement).mouseleave(function() {
        var actionsEl = jQuery('.collection-head-actions', this);
        actionsEl.css('display', 'none');
    });

    var targetElementName = '#collection-' + collection.id + " .sidebar-collection-head-name";
    var targetElementLabel = '#collection-' + collection.id + " .collection-head-actions .label";

    $(targetElementName).click(function() {
        var id = $(this).attr('data-id');
        toggleCollectionRequestList(id);
    });

    $(targetElementLabel).click(function() {
        var id = $(this).parent().parent().parent().attr('data-id');
        toggleCollectionRequestList(id);
    });
}

function toggleCollectionRequestList(id) {
    var target = "#collectionRequests-" + id;
    var label = "#collection-" + id + " .collection-head-actions .label";
    if($(target).css("display") == "none") {
        $(label).html("Hide");
        $(target).slideDown(100);
    }
    else {
        $(label).html("Show");
        $(target).slideUp(100);
    }
}

function addSidebarRequestListener(request) {
    var targetElement = '#sidebarRequest-' + request.id;
    $(targetElement).mouseenter(function() {
        var actionsEl = jQuery('.request-actions', this);
        actionsEl.css('display', 'block');
    });

    $(targetElement).mouseleave(function() {
        var actionsEl = jQuery('.request-actions', this);
        actionsEl.css('display', 'none');
    });
}

function addEditorListeners(section) {
    $('#' + section + '-ParamsFields div:last input').focus(function() {
        //Select parent element
        var fieldsParent = $(this).parents(".editorFields");
        var id = fieldsParent.attr("id");
        var section = id.split("-")[0];

        $('#' + section + '-ParamsFields div:last input').unbind('focus');

        var parent = $(this).parent();

        //Add a delete link
        var deleteHtml = "<a href=\"javascript:void(0);\" class=\"deleteParam\" tabIndex=\"-1\">";
        deleteHtml += "<img class=\"deleteButton\" src=\"images/delete.png\"/>";
        deleteHtml += "</a>";
        parent.append(deleteHtml);

        addParamInEditor(section);
    });

    $('#' + section + '-ParamsFields div input').blur(function() {
        var fieldsParent = $(this).parents(".editorFields");
        var id = fieldsParent.attr("id");
        var section = id.split("-")[0];
        setParamsFromEditor(section);
    });

    $('#' + section + '-ParamsFields div select').change(function() {
        //var paramType = $('#' + section + '-ParamsFields div select').val();
        var paramType = $(this).val();

        //var x = $(this).val();
        if (paramType) {
            var newElementHtml = "";
            newElementHtml += "<div>";
            newElementHtml += "<input type=\"text\" data-section=\"" + section + "\" name=\"" + section + "[key][]\" class=\"key\" placeholder=\"" + "key" + "\"/>";

            if (paramType == "text") {
                //addParamInEditor(sect);
                newElementHtml += "<input type=\"text\" name=\"" + section + "[value][]\" class=\"value\" placeholder=\"" + "value" + "\"/>";
                newElementHtml += "<select><option value= \"text\">Text</option>";
                newElementHtml += "<option value= \"file\">File</option></select>";
            }
            else {
                newElementHtml += '<input type="file" name="body[value][]" multiple class=\"value file\"/>';
                newElementHtml += "<select><option value= \"file\">File</option>";
                newElementHtml += "<option value= \"text\">Text</option></select>";
            }

            if ($(this).siblings().length > 2) {
                newElementHtml += "<a href=\"javascript:void(0);\" class=\"deleteParam\" tabIndex=\"-1\">";
                newElementHtml += "<img class=\"deleteButton\" src=\"images/delete.png\"/>";
                newElementHtml += "</a>";
            }
            newElementHtml += "</div>";
            $(this).parent().html(newElementHtml);
            addEditorListeners(section);
        }
        else {
            alert(" WTF " + paramType);
        }
    });

    $('.deleteParam').click(function() {
        var fieldsParent = $(this).parents(".editorFields");
        var id = fieldsParent.attr("id");
        var section = id.split("-")[0];
        $(this).parent().remove();
        setParamsFromEditor(section);
    });

    if (section === 'headers') {
        addHeaderAutoComplete();
    }
}

function setCurrentDataFormat(method) {
    $('#data ul li').removeClass('active');
    $('#data-' + method).parent().addClass('active');
}
function showBodyParamsEditor() {
    dataMode = "params";
    showParamsEditor('body');

    setCurrentDataFormat('params');
    removeBodyListeners();
    addBodyListeners();
}

function showRawEditor() {
    dataMode = "raw";
    closeParamsEditor('body');

    setCurrentDataFormat('raw');

    removeBodyListeners();
    addBodyListeners();
}

//Headers list from Wikipedia http://en.wikipedia.org/wiki/List_of_HTTP_header_fields
function addHeaderAutoComplete() {
    var availableHeaders = [
        //Standard headers
        "Accept",
        "Accept-Charset",
        "Accept-Encoding",
        "Accept-Language",
        "Authorization",
        "Cache-Control",
        "Connection",
        "Cookie",
        "Content-Length",
        "Content-MD5",
        "Content-Type",
        "Date",
        "Expect",
        "From",
        "Host",
        "If-Match",
        "If-Modified-Since",
        "If-None-Match",
        "If-Range",
        "If-Unmodified-Since",
        "Max-Forwards",
        "Pragma",
        "Proxy-Authorization",
        "Range",
        "Referer",
        "TE",
        "Upgrade",
        "User-Agent",
        "Via",
        "Warning",
        //Non standard headers
        "X-Requested-With",
        "X-Do-Not-Track",
        "DNT"
    ];

    $("#headers-ParamsFields .key").autocomplete({
        source: availableHeaders,
        delay: 50
    });
}

function addUrlAutoComplete() {
    $("#url").autocomplete({
        source: availableUrls,
        delay: 50
    });
}
function setResponseFormat(format) {
    $('#langFormat li').removeClass('active');
    $('#langFormat-' + format).addClass('active');

    var val = $('#codeData').html();

    console.log("Setting response format as", format);

    $('#responseAsText').css("display", "block");
    $('#responseAsIFrame').css("display", "none");
    $('#codeData').removeClass();
    $('#codeData').addClass('chili-lang-' + format);

    var isFormatted = $('#codeData').attr('data-formatted');

    if (format === 'javascript' && isFormatted === 'false') {
        try {
            var jsonObject = JSON.parse(val);
            var text = JSON.stringify(jsonObject, null, '\t');
            $('#codeData').html(text);
            $('#codeData').attr('data-formatted', 'true');
        }
        catch(e) {

        }
    }

    if(format !== 'raw') {
        $.chili.options.automatic.active = true;
        $('#codeData').chili();
    }
    else {
        $('#codeData').attr('data-formatted', 'false');
        $('#codeData').html(currentResponse.text);
    }
}

function attachSidebarListeners() {
    $('#sidebarContainer .pills li').click(function() {
        $('#sidebarContainer .pills li').removeClass("active");
        $(this).addClass("active");
        var section = jQuery('a', this).attr('data-id');
        showSidebarSection(section, currentSidebarSection);
    });
}

function showSidebarSection(section, previousSection) {
    $('#sidebarSection-' + previousSection).css("display", "none");
    currentSidebarSection = section;
    $('#sidebarSection-' + section).fadeIn();
}

function initCollectionSelector() {
    $('#collectionSelector').change(function(event) {
        var val = $('#collectionSelector').val();
    });
}

function submitAddToCollectionForm() {
    var existingCollectionId = $('#selectCollection').val();
    var newCollection = $('#newCollection').val();

    var collection = new Collection();

    var collectionRequest = new CollectionRequest();
    collectionRequest.id = guid();

    collectionRequest.headers = $("#headers").val();
    collectionRequest.url = $("#url").val();
    collectionRequest.method = getRequestMethod();
    collectionRequest.data = $('#body').val();
    collectionRequest.dataMode = dataMode;
    collectionRequest.time = new Date().getTime();

    if(newCollection) {
        //Add the new collection and get guid
        collection.id = guid();
        collection.name = newCollection;
        postman.indexedDB.addCollectionWithRequest(collection, collectionRequest);

        $('#newCollection').val("");
    }
    else {
        //Get guid of existing collection
        collection.id = existingCollectionId;
        collectionRequest.collectionId = collection.id;
        postman.indexedDB.addCollectionRequest(collectionRequest, true);
    }

    //Have guid here
    //Add the request to a collection
    $('#formModalAddToCollection').modal('hide');
}

postman.history.requestExists = function(request) {
    var index = -1;
    var method = request.method.toLowerCase();

    console.log(method);

    if(method === 'post' || method === 'put') {
        return -1;
    }

    var requests = postman.history.requests;
    
    for (var i = 0; i < requests.length; i++) {
        var r = requests[i];
        if (r.url.length != request.url.length ||
                r.headers.length != request.headers.length ||
                r.method != request.method) {
            index = -1;
        }
        else {
            if (r.url === request.url) {
                if (r.headers === request.headers) {
                    index = i;
                }
            }
        }

        if (index >= 0) {
            break;
        }
    }

    console.log(index);

    return index;
};

function closeAddToCollectionForm() {
    $('#formModalAddToCollection').modal('hide');
}

function closeAboutPostman() {
    $('#modalAboutPostman').modal('hide');
}

function addAvailableUrl(url) {
    if($.inArray(url, availableUrls) == -1) {
        availableUrls.push(url);
    }
}

function attachSocialButtons() {
    var currentContent = $('#aboutPostmanTwitterButton').html();
    if(currentContent === "" || !currentContent) {
        $('#aboutPostmanTwitterButton').html(socialButtons.twitter);
    }

    currentContent = $('#aboutPostmanPlusOneButton').html();
    if(currentContent === "" || !currentContent) {
        $('#aboutPostmanPlusOneButton').html(socialButtons.plusOne);
    }

    currentContent = $('#aboutPostmanFacebookButton').html();
    if(currentContent === "" || !currentContent) {
        $('#aboutPostmanFacebookButton').html(socialButtons.facebook);
    }
}