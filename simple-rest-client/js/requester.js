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
var requests;
var postman = {};

postman.history = {};
postman.history.requests = [];
postman.settings = {};

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


postman.editor = {
    mode:"html",
    codeMirror:null
};

postman.urlCache = {
    urls:[],
    addUrl:function (url) {
        if ($.inArray(url, this.urls) == -1) {
            this.urls.push(url);
        }
    }
}

postman.currentRequest = {
    url:"",
    urlParams:{},
    body:"",
    bodyParams:{},
    headers:[],
    method:"get",
    dataMode:"params",
    methodsWithBody:["post", "put", "patch"],

    response:{
        startTime:0,
        endTime:0,
        totalTime:0,
        status:"",
        time:0,
        headers:{},
        mime:"",
        state:{
            size:"normal"
        },
        previewType:"parsed",

        getTotalTime:function () {
            this.totalTime = this.endTime - this.startTime;
            return this.totalTime;
        }
    },

    isMethodWithBody:function (method) {
        if ($.inArray(method, this.methodsWithBody) >= 0) {
            return true;
        }
        else {
            return false;
        }
    }
};

postman.interface = {
    socialButtons:{
        "facebook":'<iframe src="http://www.facebook.com/plugins/like.php?href=https%3A%2F%2Fchrome.google.com%2Fwebstore%2Fdetail%2Ffdmmgilgnpjigdojojpjoooidkmcomcm&amp;send=false&amp;layout=button_count&amp;width=250&amp;show_faces=true&amp;action=like&amp;colorscheme=light&amp;font&amp;height=21&amp;appId=26438002524" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:250px; height:21px;" allowTransparency="true"></iframe>',
        "twitter":'<a href="https://twitter.com/share" class="twitter-share-button" data-url="https://chrome.google.com/webstore/detail/fdmmgilgnpjigdojojpjoooidkmcomcm" data-text="I am using Postman to kick some API ass!" data-count="horizontal" data-via="a85">Tweet</a><script type="text/javascript" src="http://platform.twitter.com/widgets.js"></script>',
        "plusOne":'<script type="text/javascript" src="https://apis.google.com/js/plusone.js"></script><g:plusone size="medium" href="https://chrome.google.com/webstore/detail/fdmmgilgnpjigdojojpjoooidkmcomcm"></g:plusone>'
    },

    attachSocialButtons:function () {
        var currentContent = $('#aboutPostmanTwitterButton').html();
        if (currentContent === "" || !currentContent) {
            $('#aboutPostmanTwitterButton').html(this.socialButtons.twitter);
        }

        currentContent = $('#aboutPostmanPlusOneButton').html();
        if (currentContent === "" || !currentContent) {
            $('#aboutPostmanPlusOneButton').html(this.socialButtons.plusOne);
        }

        currentContent = $('#aboutPostmanFacebookButton').html();
        if (currentContent === "" || !currentContent) {
            $('#aboutPostmanFacebookButton').html(this.socialButtons.facebook);
        }
    },

    setLayout:function () {
        this.refreshScrollPanes();
    },

    refreshScrollPanes:function () {
        var newMainWidth = $('#container').width() - $('#sidebar').width();
        $('#main').width(newMainWidth + "px");

        $('#sidebar').jScrollPane({
            mouseWheelSpeed:24
        });
    },

    sidebar: {
        currentSection: "history",
        sections: [ "history", "collections" ],
        select: function(section) {
            $('#sidebarSection-' + this.currentSection).css("display", "none");
            this.currentSection = section;
            $('#sidebarSection-' + section).fadeIn();
            return true;
        }
    }
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

function startNewRequest() {
    $("#url").val("");
    $('#headers').val("");
    clearFields();

    //clearHeaders
    //close edit params
    $('.method-selectors li').removeClass('active');
    $('.method-selector-get').addClass('active');
    showParamsEditor("headers");
    showRequestMethodUi('get');
    $('#url').focus();
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

postman.initializeHeadersFromString = function (data) {
    if (data === null || data === "") {
        postman.currentRequest.headers = [];
    }
    else {
        var vars = [], hash;
        var hashes = data.split('\n');
        var header;

        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split(":");
            header = {
                "name":jQuery.trim(hash[0]),
                "value":jQuery.trim(hash[1])
            };

            vars.push(header);
        }

        postman.currentRequest.headers = vars;
    }
}

function sendRequest() {
    if ($("#url").val() != "") {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = readResponse;

        var headers = $("#headers").val();
        var url = $("#url").val();

        url = ensureProperUrl(url);

        var method = postman.currentRequest.method;

        var data = "";
        var bodyData = "";

        xhr.open(method, url, true);

        headers = headers.split("\n");
        for (var i = 0; i < headers.length; i++) {
            var header = headers[i].split(": ");
            if (header[1]) {
                xhr.setRequestHeader(header[0], header[1]);
            }
        }

        if (postman.currentRequest.isMethodWithBody(method)) {
            if (postman.currentRequest.dataMode === 'raw') {
                data = $("#body").val();
                bodyData = data;
            }
            else if (postman.currentRequest.dataMode === 'params') {
                bodyData = new FormData();

                //Iterate through all key/values

                $('input[data-section=body]').each(function () {
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

        postman.currentRequest.response.startTime = new Date().getTime();
        saveRequest(url, method, $("#headers").val(), data, postman.currentRequest.dataMode);
        $('#submitRequest').button("loading");

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

function setResponseHeaders(headersString) {
    var headers = headersString.split("\n");
    var count = headers.length;
    var finalHeaders = [];
    console.log(headers);
    for (var i = 0; i < count; i++) {
        var h = headers[i];
        var hParts = h.split(":");

        if (hParts && hParts.length > 0) {
            var header = {
                "name":hParts[0],
                "value":hParts[1],
                "description":headerDetails[hParts[0].toLowerCase()]
            };

            if (hParts[0] != "") {
                finalHeaders.push(header);
            }
        }
    }

    $('#responseHeaders').html("");
    $("#itemResponseHeader").tmpl(finalHeaders).appendTo("#responseHeaders");
    $('.responseHeaderName').popover();
}

function readResponse() {
    $('#response').css("display", "block");
    $('#submitRequest').button("reset");

    $('#responseStatus').css("display", "block");
    $('#responseHeaders').css("display", "block");
    $('#codeData').css("display", "block");

    if (this.readyState == 4) {
        try {
            if (this.status == 0) {
                $('#modalResponseError').modal({
                    keyboard:true,
                    backdrop:"static"
                });

                $('#modalResponseError').modal('show');
            }
            var responseCode = {
                'code':this.status,
                'name':httpStatusCodes[this.status]['name'],
                'detail':httpStatusCodes[this.status]['detail']
            };

            $('#pstatus').html('');
            $('#itemResponseCode').tmpl([responseCode]).appendTo('#pstatus');
            $('.responseCode').popover();

            setResponseHeaders(this.getAllResponseHeaders());

            var debugurl = /X-Debug-URL: (.*)/i.exec($("#responseHeaders").val());
            if (debugurl) {
                $("#debugLink").attr('href', debugurl[1]).html(debugurl[1]);
                $("#debugLinks").css("display", "");
            }

            postman.currentRequest.response.text = this.responseText;

            $("#respHeaders").css("display", "");
            $("#respData").css("display", "");

            $("#loader").css("display", "none");
            $("#responsePrint").css("display", "");

            postman.currentRequest.response.endTime = new Date().getTime();
            var diff = postman.currentRequest.response.getTotalTime();

            $('#ptime .data').html(diff + " ms");
            $('#pbodysize .data').html(diff + " bytes");

            var contentType = this.getResponseHeader("Content-Type");

            var type = 'html';
            var format = 'html';

            if (contentType.search(/json/i) != -1) {
                type = 'json';
                format = 'javascript';
            }

            $('#language').val(format);

            if (contentType.search(/image/i) == -1) {
                $('#responseAsText').css("display", "block");
                $('#responseAsImage').css("display", "none");
                $('#langFormat').css("display", "block");
                $('#respDataActions').css("display", "block");
                setResponseFormat(format, postman.currentRequest.response.text, "parsed");
            }
            else {
                $('#responseAsText').css("display", "none");
                $('#responseAsImage').css("display", "block");
                var imgLink = $('#url').val();
                $('#langFormat').css("display", "none");
                $('#respDataActions').css("display", "none");
                $('#responseAsImage').html("<img src='" + imgLink + "'/>");
            }

        }
        catch (e) {
            console.log("Something went wrong while receiving the response");
        }
    }
    else {
    }

    postman.interface.setLayout();
}

//Manages showing/hiding the PUT/POST additional UI
function showRequestMethodUi(type) {
    var t = type.toLowerCase();
    postman.currentRequest.method = t;

    if (postman.currentRequest.isMethodWithBody(t)) {
        $("#data").css("display", "block");
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

    $("#submitRequest").click(function () {
        sendRequest();
    });

    $('#requestMethodSelector').change(function () {
        var val = $(this).val();
        showRequestMethodUi(val);
    });

    $('#sidebarSelectors li a').click(function() {
        var id = $(this).attr('data-id');
        postman.interface.sidebar.select(id);
    });
}

postman.loadNewRequestFromLink = function (link) {
    console.log("Loading new request", link);
    startNewRequest();
    $('#url').val(link);
}

function setupDB() {
    postman.indexedDB.onerror = function (event) {
        console.log(event);
    };

    postman.indexedDB.open = function () {
        var request = indexedDB.open("postman", "POSTman request history");
        request.onsuccess = function (e) {
            var v = "0.42";
            postman.indexedDB.db = e.target.result;
            var db = postman.indexedDB.db;

            //We can only create Object stores in a setVersion transaction
            if (v != db.version) {
                console.log(v, "Version is not the same");
                var setVrequest = db.setVersion(v);

                setVrequest.onfailure = function (e) {
                    console.log(e);
                };

                setVrequest.onsuccess = function (e) {
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

                    var requestStore = db.createObjectStore("requests", {keyPath:"id"});
                    var collectionsStore = db.createObjectStore("collections", {keyPath:"id"});
                    var collectionRequestsStore = db.createObjectStore("collection_requests", {keyPath:"id"});

                    requestStore.createIndex("timestamp", "timestamp", { unique:false});
                    collectionsStore.createIndex("timestamp", "timestamp", { unique:false});

                    collectionRequestsStore.createIndex("timestamp", "timestamp", { unique:false});
                    collectionRequestsStore.createIndex("collectionId", "collectionId", { unique:false});

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

    postman.indexedDB.addCollection = function (collection) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collections"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("collections");

        var request = store.put({
            "id":collection.id,
            "name":collection.name,
            "timestamp":new Date().getTime()
        });

        request.onsuccess = function (e) {
            $('#messageNoCollection').remove();
            postman.indexedDB.getCollections();
            postman.indexedDB.getAllRequestsInCollection(collection.id);
        };

        request.onerror = function (e) {
            console.log(e.value);
        }
    };

    postman.indexedDB.addCollectionWithRequest = function (collection, collectionRequest) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collections"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("collections");

        var request = store.put({
            "id":collection.id,
            "name":collection.name
        });

        request.onsuccess = function (e) {
            collectionRequest.collectionId = collection.id;

            $('#itemCollectionSelectorList').tmpl([collection]).appendTo('#selectCollection');
            $('#itemCollectionSidebarHead').tmpl([collection]).appendTo('#collectionItems');

            addSidebarCollectionHeadListener(collection);
            postman.interface.refreshScrollPanes();

            postman.indexedDB.addCollectionRequest(collectionRequest, true);
        };

        request.onerror = function (e) {
            console.log(e.value);
        }
    }

    postman.indexedDB.addCollectionRequest = function (req, toRefreshSidebar) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collection_requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("collection_requests");

        var collectionRequest = store.put({
            "collectionId":req.collectionId,
            "id":req.id,
            "url":req.url.toString(),
            "method":req.method.toString(),
            "headers":req.headers.toString(),
            "data":req.data.toString(),
            "dataMode":req.dataMode.toString(),
            "timestamp":req.timestamp
        });

        collectionRequest.onsuccess = function (e) {
            var targetElement = "#collectionRequests-" + req.collectionId;
            postman.urlCache.addUrl(req.url);
            addUrlAutoComplete();

            req.url = limitStringLineWidth(req.url, 43);
            $('#itemCollectionSidebarRequest').tmpl([req]).appendTo(targetElement);
            addSidebarRequestListener(req);
            postman.interface.refreshScrollPanes();
            $('#messageNoCollection').remove();
        };

        collectionRequest.onerror = function (e) {
            console.log(e.value);
        }
    };

    postman.indexedDB.getCollections = function () {
        var db = postman.indexedDB.db;

        if (db == null) {
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
        numCollections = 0;
        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;
            if (!!result == false) {
                if (numCollections == 0) {
                    var obj = new Object();
                    $('#messageNoCollectionTmpl').tmpl([obj]).appendTo('#sidebarSection-collections');
                }

                return;
            }

            var collection = result.value;
            numCollections++;
            $('#itemCollectionSelectorList').tmpl([collection]).appendTo('#selectCollection');
            $('#itemCollectionSidebarHead').tmpl([collection]).appendTo('#collectionItems');
            postman.interface.refreshScrollPanes();

            postman.indexedDB.getAllRequestsInCollection(collection.id);
            //This wil call onsuccess again and again until no more request is left

            addSidebarCollectionHeadListener(collection);

            result.
            continue
            ();
        };

        cursorRequest.onerror = function (e) {
            console.log(e);
        };
    };

    postman.indexedDB.getAllRequestsInCollection = function (id) {
        $('#collectionRequests-' + id).html("");
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collection_requests"], IDBTransaction.READ_WRITE);

        //Get everything in the store
        var keyRange = IDBKeyRange.only(id);
        var store = trans.objectStore("collection_requests");

        var index = store.index("collectionId");
        var cursorRequest = index.openCursor(keyRange);

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;

            if (!!result == false) {
                return;
            }

            var request = result.value;
            var targetElement = "#collectionRequests-" + request.collectionId;

            postman.urlCache.addUrl(request.url);
            addUrlAutoComplete();

            request.url = limitStringLineWidth(request.url, 40);
            $('#itemCollectionSidebarRequest').tmpl([request]).appendTo(targetElement);
            addSidebarRequestListener(request);
            postman.interface.refreshScrollPanes();

            //This wil call onsuccess again and again until no more request is left
            result.
            continue
            ();
        };
        cursorRequest.onerror = postman.indexedDB.onerror;
    };

    postman.indexedDB.addRequest = function (id, url, method, headers, data, dataMode) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("requests");
        var historyRequest = {
            "id":id,
            "url":url.toString(),
            "method":method.toString(),
            "headers":headers.toString(),
            "data":data.toString(),
            "dataMode":dataMode.toString(),
            "timestamp":new Date().getTime()
        };

        var index = postman.history.requestExists(historyRequest);
        if (index >= 0) {
            var deletedId = postman.history.requests[index].id;
            postman.indexedDB.deleteRequest(deletedId);
            postman.history.requests.splice(index, 1);
        }

        var request = store.put(historyRequest);

        request.onsuccess = function (e) {
            //Re-render all the todos
            postman.urlCache.addUrl(url);
            addUrlAutoComplete();
            removeRequestFromSidebar(deletedId, false);
            renderRequestToSidebar(url, method, id, "top");
            addSidebarRequestListener(historyRequest);
            postman.history.requests.push(historyRequest);
        };

        request.onerror = function (e) {
            console.log(e.value);
        }
    };

    postman.indexedDB.getRequest = function (id) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("requests");

        //Get everything in the store
        var cursorRequest = store.get(id);

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;
            if (!!result == false)
                return;

            loadRequestInEditor(result);
            return result;
        };
        cursorRequest.onerror = postman.indexedDB.onerror;
    };

    postman.indexedDB.getCollectionRequest = function (id) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collection_requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("collection_requests");

        //Get everything in the store
        var cursorRequest = store.get(id);

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;
            if (!!result == false)
                return;

            loadRequestInEditor(result);
            return result;
        };
        cursorRequest.onerror = postman.indexedDB.onerror;
    };

    postman.indexedDB.getAllRequestItems = function () {
        var db = postman.indexedDB.db;
        if (db == null) {
            return;
        }

        var trans = db.transaction(["requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("requests");

        //Get everything in the store
        var keyRange = IDBKeyRange.lowerBound(0);
        var index = store.index("timestamp");
        var cursorRequest = index.openCursor(keyRange);
        var historyRequests = [];

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;

            if (!!result == false) {
                for (var i = 0; i < historyRequests.length; i++) {
                    var r = historyRequests[i];
                    postman.urlCache.addUrl(r.url);
                    renderRequestToSidebar(r.url, r.method, r.id, "top");
                    addSidebarRequestListener(r);
                }

                addUrlAutoComplete();

                $('#historyItems').fadeIn();

                postman.history.requests = historyRequests;

                if (postman.history.requests.length == 0) {
                    $('#messageNoHistoryTmpl').tmpl([new Object()]).appendTo('#sidebarSection-history');
                }

                return;
            }

            var request = result.value;
            historyRequests.push(request);

            //This wil call onsuccess again and again until no more request is left
            result.
            continue
            ();
        };

        cursorRequest.onerror = postman.indexedDB.onerror;
    };

    postman.indexedDB.deleteRequest = function (id) {
        try {
            var db = postman.indexedDB.db;
            var trans = db.transaction(["requests"], IDBTransaction.READ_WRITE);
            var store = trans.objectStore(["requests"]);

            var request = store.delete(id);

            request.onsuccess = function (e) {
                removeRequestFromSidebar(id);

            };

            request.onerror = function (e) {
                console.log(e);
            };
        }
        catch (e) {
            console.log(e);
        }

    };

    postman.indexedDB.deleteHistory = function () {
        var db = postman.indexedDB.db;
        var clearTransaction = db.transaction(["requests"], IDBTransaction.READ_WRITE);
        var clearRequest = clearTransaction.objectStore(["requests"]).clear();
        clearRequest.onsuccess = function (event) {
            $('#historyItems').html("");
            $('#messageNoHistoryTmpl').tmpl([new Object()]).appendTo('#sidebarSection-history');
        };
    }

    postman.indexedDB.deleteCollectionRequest = function (id) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collection_requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore(["collection_requests"]);

        var request = store.delete(id);

        request.onsuccess = function (e) {
            removeRequestFromSidebar(id);
        };

        request.onerror = function (e) {
            console.log(e);
        };
    };

    postman.indexedDB.deleteAllCollectionRequests = function (id) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collection_requests"], IDBTransaction.READ_WRITE);

        //Get everything in the store
        var keyRange = IDBKeyRange.only(id);
        var store = trans.objectStore("collection_requests");

        var index = store.index("collectionId");
        var cursorRequest = index.openCursor(keyRange);

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;

            if (!!result == false) {
                return;
            }

            var request = result.value;
            postman.indexedDB.deleteCollectionRequest(request.id);
            result.
            continue
            ();
        };
        cursorRequest.onerror = postman.indexedDB.onerror;
    };

    postman.indexedDB.deleteCollection = function (id) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collections"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore(["collections"]);

        var request = store.delete(id);

        request.onsuccess = function (e) {
            removeCollectionFromSidebar(id);
            removeCollectionFromSelector(id);
            var numCollections = $('#collectionItems').children().length;
            if (numCollections == 1) {
                $('#messageNoCollectionTmpl').tmpl([new Object()]).appendTo('#sidebarSection-collections');
            }
        };

        request.onerror = function (e) {
            console.log(e);
        };
    };
}


function initDB() {
    postman.indexedDB.open(); //Also displays the data previously saved
}

//History management functions
function saveRequest(url, method, headers, data, dataMode) {
    if (postman.settings.autoSaveRequest) {
        var id = guid();
        var maxHistoryCount = postman.settings.historyCount;
        var requestsCount = postman.history.requests.length;
        console.log(maxHistoryCount, requestsCount);
        if (requestsCount >= maxHistoryCount) {
            //Delete the last request
            var lastRequest = postman.history.requests[requestsCount - 1];
            postman.indexedDB.deleteRequest(lastRequest.id);
        }
        postman.indexedDB.addRequest(id, url, method, headers, data, dataMode);
    }

}

function showEmptyHistoryMessage() {
    $('#emptyHistoryMessage').css("display", "block");
}

function hideEmptyHistoryMessage() {
    $('#emptyHistoryMessage').css("display", "none");
}

function renderRequestToSidebar(url, method, id, position) {
    if (url.length > 80) {
        url = url.substring(0, 80) + "...";
    }
    url = limitStringLineWidth(url, 40);

    var request = {
        "url":url,
        "method":method,
        "id":id,
        "position":position
    };

    if (position === 'top') {
        $('#itemHistorySidebarRequest').tmpl([request]).prependTo('#historyItems');
    }
    else {
        $('#itemHistorySidebarRequest').tmpl([request]).appendTo('#historyItems');
    }

    $('#messageNoHistory').remove();
    postman.interface.refreshScrollPanes();
}

function removeRequestFromSidebar(id, toAnimate) {
    var historyRequests = postman.history.requests;
    var k = -1;
    for (var i = 0; i < historyRequests.length; i++) {
        if (historyRequests[i].id === id) {
            k = i;
            break;
        }
    }

    if (k >= 0) {
        postman.history.requests.splice(k, 1);
        if (postman.history.requests.length == 0) {
            $('#messageNoHistoryTmpl').tmpl([new Object()]).appendTo('#sidebarSection-history');
        }
    }

    if (toAnimate) {
        $('#sidebarRequest-' + id).slideUp(100);
    }
    else {
        $('#sidebarRequest-' + id).remove();
    }

    postman.interface.refreshScrollPanes();
}

function removeCollectionFromSidebar(id) {
    $('#collection-' + id).slideUp(100);
    postman.interface.refreshScrollPanes();
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
    showRequestHelper("normal");
    var method = request.method.toLowerCase();
    postman.currentRequest.method = method.toUpperCase();

    $('#url').val(request.url);

    //Set proper class for method and the variable

    $('#headers').val(request.headers);
    postman.initializeHeadersFromString(request.headers);
    showParamsEditor('headers');

    $('#urlParamsEditor').css("display", "none");
    $('#response').css("display", "none");

    $('#requestMethodSelector').val(method);

    if (method === 'post' || method === 'put' || method === 'patch') {
        var dataMode = request.dataMode.toLowerCase();

        $('#data').css("display", "block");
        $('#body').val(request.data);
        $('#body').css("display", "block");

        $('#data .pills li').removeClass("active");
        if (dataMode == 'params') {
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

    postman.currentRequest.method = method;

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

//Sets the param strings for header and url params
function setParamsFromEditor(section) {
    var paramString = "";
    var h = [];
    //Goes through each item in the param editor and generates a param string
    $('input[data-section="' + section + '"]').each(function () {
        var val = $(this).next().val();
        if (val !== "" && $(this).val() !== "") {
            if (section !== 'headers') {
                paramString += $(this).val() + "=" + val + "&";
            }
            else {
                paramString += $(this).val() + ": " + val + "\n";
            }

            if (section == "headers") {
                var header = {
                    name:$(this).val(),
                    value:val
                };

                h.push(header);
            }
        }
    });


    paramString = paramString.substr(0, paramString.length - 1);

    if (section === 'url') {
        var url = $('#url').val();
        var baseUrl = url.split("?")[0];
        $('#' + section).val(baseUrl + "?" + paramString);
        postman.currentRequest.url = $('#url').val();
    }
    else if (section === 'body') {
        $('#' + section).val(paramString);
        postman.currentRequest.body = paramString;
    }
    else if (section === 'headers') {
        postman.currentRequest.headers = h;
        $('#' + section).val(paramString);
    }
}

function showParamsEditor(section) {
    var data = $('#' + section).val();

    var params;
    var placeHolderKey = "Key";
    var placeHolderValue = "Value";

    if (section === 'headers') {
        params = getHeaderVars(data);
        placeHolderKey = "Header";
        placeHolderValue = "Value";
    }
    else if (section === 'body') {
        params = getUrlVars(data);
    }
    else {
        params = getUrlVars(data);
    }

    var editorHtml = "";
    var i = 0;
    var paramsLength = params.length;
    var rowData = {};
    var rows = [];
    $('#' + section + '-ParamsFields').html("");
    for (var index = 0; i < paramsLength; index++) {
        var element = params[index];
        var key = element.key;
        var value = element.value;

        if (key != "") {
            rowData = {
                section:section,
                placeHolderKey:placeHolderKey,
                placeHolderValue:placeHolderValue,
                key:key,
                value:value,
                inputType:"text",
                canBeClosed:true
            };
            rows.push(rowData);
        }


        i++;
    }

    rowData = {
        section:section,
        placeHolderKey:placeHolderKey,
        placeHolderValue:placeHolderValue,
        key:"",
        value:"",
        inputType:"text",
        canBeClosed:false
    };

    rows.push(rowData);

    $('#itemParamsEditor').tmpl(rows).appendTo('#' + section + '-ParamsFields');
    $('#' + section + '-ParamsEditor').fadeIn();
    addEditorListeners(section);
}

function deleteParam(section) {
    alert("To delete " + section + " param");
}

function closeParamsEditor(section) {
    $('#' + section + '-ParamsFields div:last input').unbind('focus', sectionParamsLastInputFocusHandler);
    $('#' + section + '-ParamsFields input').unbind('blur', sectionParamsInputBlurHandler);
    $('#' + section + '-ParamsEditor input.key').autocomplete("destroy");
    $('#' + section + '-ParamsEditor').css("display", "none");
}

function addParamInEditor(section, data) {
    var placeHolderKey = "Key";
    var placeHolderValue = "Value";

    if (section === 'headers') {
        placeHolderKey = "Header";
        placeHolderValue = "Value";
    }


    var key = "";
    var value = "";
    var send = "";

    if (data) {
        key = data.key;
        value = data.value;
    }

    var rowData = {
        section:section,
        placeHolderKey:placeHolderKey,
        placeHolderValue:placeHolderValue,
        key:key,
        value:value,
        canBeClosed:false,
        inputType:"text"
    };

    $('#itemParamsEditor').tmpl([rowData]).appendTo('#' + section + '-ParamsFields');
    addEditorListeners(section);
}

function changeParamInEditor(target) {
    if (target == "file") {

    }
}

function initializeSettings() {
    if (localStorage['historyCount']) {
        postman.settings.historyCount = localStorage['historyCount'];
    }
    else {
        postman.settings.historyCount = 100;
        localStorage['historyCount'] = postman.settings.historyCount;
    }

    if (localStorage['autoSaveRequest']) {
        postman.settings.autoSaveRequest = localStorage['autoSaveRequest'];
    }
    else {
        postman.settings.autoSaveRequest = true;
        localStorage['autoSaveRequest'] = postman.settings.autoSaveRequest;
    }

    $('#historyCount').val(postman.settings.historyCount);
    $('#autoSaveRequest').val(postman.settings.autoSaveRequest);

    $('#historyCount').change(function () {
        postman.settings.historyCount = $('#historyCount').val();
        localStorage['historyCount'] = postman.settings.historyCount;
    });

    $('#autoSaveRequest').change(function () {
        var val = $('#autoSaveRequest').val();
        if (val == 'yes') {
            postman.settings.autoSaveRequest = true;
        }
        else {
            postman.settings.autoSaveRequest = false;
        }

        localStorage['autoSaveRequest'] = postman.settings.autoSaveRequest;
    });
}

function addSidebarCollectionHeadListener(collection) {
    var targetElement = '#collection-' + collection.id + " .sidebar-collection-head";
    $(targetElement).mouseenter(function () {
        var actionsEl = jQuery('.collection-head-actions', this);
        actionsEl.css('display', 'block');
    });

    $(targetElement).mouseleave(function () {
        var actionsEl = jQuery('.collection-head-actions', this);
        actionsEl.css('display', 'none');
    });

    var targetElementName = '#collection-' + collection.id + " .sidebar-collection-head-name";
    var targetElementLabel = '#collection-' + collection.id + " .collection-head-actions .label";

    $(targetElementName).bind("click", function () {
        var id = $(this).attr('data-id');
        toggleCollectionRequestList(id);
    });

    $(targetElementLabel).bind("click", function () {
        var id = $(this).parent().parent().parent().attr('data-id');
        toggleCollectionRequestList(id);
    });
}

function toggleCollectionRequestList(id) {
    var target = "#collectionRequests-" + id;
    var label = "#collection-" + id + " .collection-head-actions .label";
    if ($(target).css("display") == "none") {
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
    $(targetElement).mouseenter(function () {
        var actionsEl = jQuery('.request-actions', this);
        actionsEl.css('display', 'block');
    });

    $(targetElement).mouseleave(function () {
        var actionsEl = jQuery('.request-actions', this);
        actionsEl.css('display', 'none');
    });
}

var sectionParamsLastInputFocusHandler = function (evt) {
    //Select parent element
    var fieldsParent = $(this).parents(".editorFields");
    var id = fieldsParent.attr("id");
    var section = id.split("-")[0];

    $('#' + section + '-ParamsFields div:last input').unbind('focus', sectionParamsLastInputFocusHandler);

    var parent = $(this).parent();

    //Add a delete link
    var deleteHtml = "<a href=\"javascript:void(0);\" class=\"deleteParam\">";
    deleteHtml += "<img class=\"deleteButton\" src=\"img/delete.png\"/>";
    deleteHtml += "</a>";
    parent.append(deleteHtml);

    addParamInEditor(section);
    return true;
};

var sectionParamsInputBlurHandler = function (evt) {
    var fieldsParent = $(this).parents(".editorFields");
    var id = fieldsParent.attr("id");
    var section = id.split("-")[0];
    setParamsFromEditor(section);
};

var sectionParamsSelectChangeHandler = function (evt) {
    //var paramType = $('#' + section + '-ParamsFields div select').val();
    var paramType = $(this).val();

    placeHolderKey = "Key";
    placeHolderValue = "Value";

    var key = "";
    var value = "";
    var send = "";

    var fieldsParent = $(this).parents(".editorFields");
    var id = fieldsParent.attr("id");
    var section = id.split("-")[0];

    if (paramType) {
        var rowData = {
            section:section,
            placeHolderKey:placeHolderKey,
            placeHolderValue:placeHolderValue,
            key:key,
            value:value,
            inputType:"text",
            canBeClosed:false
        };

        if ($(this).siblings().length > 2) {
            rowData.canBeClosed = true;
        }

        if (paramType === "text") {
            rowData.selectedText = "selected";
            rowData.selectedFile = "";
        }
        else {
            rowData.selectedText = "";
            rowData.selectedFile = "selected";
        }

        rowData.inputType = paramType;

        $('#itemParamsEditor').tmpl([rowData]).appendTo($(this).parent().empty());
        addEditorListeners(section);
    }
    else {
    }
};

var deleteParamHandler = function (evt) {
    var fieldsParent = $(this).parents(".editorFields");
    var id = fieldsParent.attr("id");
    if (id) {
        var section = id.split("-")[0];
        $(this).parent().remove();
        setParamsFromEditor(section);
    }
}

function addEditorListeners(section) {
    $('#' + section + '-ParamsFields div:last input').bind("focus", sectionParamsLastInputFocusHandler);
    $('#' + section + '-ParamsFields div input').bind("blur", sectionParamsInputBlurHandler);
    $('#' + section + '-ParamsFields div select').bind("change", sectionParamsSelectChangeHandler);
    $('.deleteParam').bind("click", deleteParamHandler);
    if (section === 'headers') {
        addHeaderAutoComplete();
    }

    $('#' + section + '-ParamsFields div input').unbind('keydown', 'esc', escInputHandler);
    $('#' + section + '-ParamsFields div select').unbind('keydown', 'esc', escInputHandler);
    $('#' + section + '-ParamsFields div input').bind('keydown', 'esc', escInputHandler);
    $('#' + section + '-ParamsFields div select').bind('keydown', 'esc', escInputHandler);
}

function setCurrentDataFormat(method) {
    $('#data ul li').removeClass('active');
    $('#data-' + method).parent().addClass('active');
}

function showBodyParamsEditor() {
    postman.currentRequest.dataMode = "params";
    showParamsEditor('body');

    $('#bodyDataContainer').css("display", "none");
    setCurrentDataFormat('params');
}

function showRawEditor() {
    postman.currentRequest.dataMode = "raw";
    closeParamsEditor('body');

    setCurrentDataFormat('raw');
    $('#bodyDataContainer').css("display", "block");
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
        source:availableHeaders,
        delay:50
    });
}

function addUrlAutoComplete() {
    $("#url").autocomplete({
        source:postman.urlCache.urls,
        delay:50
    });
}

function changeResponseFormat(format) {
    $('#langFormat li').removeClass('active');
    $('#langFormat-' + format).addClass('active');

    if (format === 'raw') {
        postman.editor.codeMirror.toTextArea();
        $('#codeData').val(postman.currentRequest.response.text);
        var codeDataWidth = $(document).width() - $('#sidebar').width() - 60;
        $('#codeData').css("width", codeDataWidth + "px");
        $('#codeData').css("height", "600px");
    }
    else {
        $('#codeData').css("display", "none");
        var mime = $('#codeData').attr('data-mime');
        setResponseFormat(mime, postman.currentRequest.response.text, "parsed", true);
    }

}

function setResponseFormat(mime, response, format, forceCreate) {
    $('#langFormat li').removeClass('active');
    $('#langFormat-' + format).addClass('active');
    $('#codeData').css("display", "none");

    $('#codeData').attr("data-mime", mime);

    var codeDataArea = document.getElementById("codeData");
    var foldFunc;
    var mode;

    if (mime === 'javascript') {
        mode = 'javascript';
        try {
            var jsonObject = JSON.parse(response);
            var response = JSON.stringify(jsonObject, null, '\t');
        }
        catch (e) {
        }
        foldFunc = CodeMirror.newFoldFunction(CodeMirror.braceRangeFinder);
    }
    else if (mime === 'html') {
        mode = 'xml';
        foldFunc = CodeMirror.newFoldFunction(CodeMirror.tagRangeFinder);
    }

    postman.editor.mode = mode;
    if (!postman.editor.codeMirror || forceCreate) {
        postman.editor.codeMirror = CodeMirror.fromTextArea(codeDataArea,
            {
                mode:"links",
                lineNumbers:true,
                fixedGutter:true,
                onGutterClick:foldFunc,
                theme:'eclipse',
                lineWrapping:true,
                readOnly:true
            });

        postman.editor.codeMirror.setValue(response);

    }
    else {
        postman.editor.codeMirror.setValue(response);
        postman.editor.codeMirror.setOption("onGutterClick", foldFunc);
        postman.editor.codeMirror.setOption("mode", "links");
        postman.editor.codeMirror.setOption("lineWrapping", true);
        postman.editor.codeMirror.setOption("theme", "eclipse");
        postman.editor.codeMirror.setOption("readOnly", true);
    }

    $('#codeData').val(response);
}

function initCollectionSelector() {
    $('#collectionSelector').change(function (event) {
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
    collectionRequest.method = postman.currentRequest.method;
    collectionRequest.data = $('#body').val();
    collectionRequest.dataMode = postman.currentRequest.dataMode;
    collectionRequest.time = new Date().getTime();

    if (newCollection) {
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

function submitNewCollectionForm() {
    var newCollection = $('#newCollectionBlank').val();

    var collection = new Collection();

    if (newCollection) {
        //Add the new collection and get guid
        collection.id = guid();
        collection.name = newCollection;
        postman.indexedDB.addCollection(collection);

        $('#newCollectionBlank').val("");
    }

    $('#formModalNewCollection').modal('hide');
}
postman.history.requestExists = function (request) {
    var index = -1;
    var method = request.method.toLowerCase();

    if (method === 'post' || method === 'put') {
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

    return index;
};

function clearHistory() {
    postman.indexedDB.deleteHistory();
}

function dropboxSync() {
    if (!dropbox.isLoggedin()) {
        $('#modalDropboxSync').modal('show');
        dropbox.login_v1();
    } else {
        dropbox.oauthRequest({
            url:"https://api.dropbox.com/1/oauth/access_token",
            method:"POST"
        }, [], function hello(data) {
            console.log(data);
        });
        /*dropbox.getAccount(function accountData(data) {
         console.log(data);
         });*/
    }
}

function checkDropboxLogin() {
    if (dropbox.afterAuthentication === true) {
        $('#modalDropboxSync .modal-body p').html('Succesfully connected to Dropbox!');
        $('#modalDropboxSync').modal('show');
    }
}

function toggleResponseBodySize() {
    if (postman.currentRequest.response.state.size == "normal") {
        postman.currentRequest.response.state.size = "maximized";
        $('#responseBodyToggle img').attr("src", "img/full-screen-exit-alt-2.png");
        postman.currentRequest.response.state.width = $('#respData').width();
        postman.currentRequest.response.state.height = $('#respData').height();
        postman.currentRequest.response.state.display = $('#respData').css("display");
        postman.currentRequest.response.state.position = $('#respData').css("position");

        $('#respData').css("position", "absolute");
        $('#respData').css("left", 0);
        $('#respData').css("top", 0);
        $('#respData').css("width", $(document).width() - 20);
        $('#respData').css("height", $(document).height());
        $('#respData').css("z-index", 100);
        $('#respData').css("background-color", "white");
        $('#respData').css("padding", "10px");
    }
    else {
        postman.currentRequest.state.size = "normal";
        $('#responseBodyToggle img').attr("src", "img/full-screen-alt-4.png");
        $('#respData').css("position", postman.currentRequest.response.state.position);
        $('#respData').css("left", 0);
        $('#respData').css("top", 0);
        $('#respData').css("width", postman.currentRequest.response.state.width);
        $('#respData').css("height", postman.currentRequest.response.state.height);
        $('#respData').css("z-index", 10);
        $('#respData').css("background-color", "white");
        $('#respData').css("padding", "0px");
    }
}

function minimizeResponseBody() {
    $('#respData').css("padding", "0px");
}

var escInputHandler = function (evt) {
    $(evt.target).blur();
};

function setupKeyboardShortcuts() {

    var selectGetHandler = function (evt) {
        showRequestMethodUi('get');
        return false;
    };

    var selectPostHandler = function (evt) {
        showRequestMethodUi('post');
        return false;
    };

    var selectPutHandler = function (evt) {
        showRequestMethodUi('put');
        return false;
    };

    var selectDeleteHandler = function (evt) {
        showRequestMethodUi('delete');
        return false;
    };

    var selectHeadHandler = function (evt) {
        showRequestMethodUi('head');
        return false;
    };

    var selectOptionsHandler = function (evt) {
        showRequestMethodUi('options');
        return false;
    };

    var clearHistoryHandler = function (evt) {
        clearHistory();
        return false;
    };

    var urlFocusHandler = function (evt) {
        $('#url').focus();
        return false;
    };

    var newRequestHandler = function (evt) {
        startNewRequest();
    };

    $('input').bind('keydown', 'esc', escInputHandler);
    $('textarea').bind('keydown', 'esc', escInputHandler);
    $('select').bind('keydown', 'esc', escInputHandler);

    $(document).bind('keydown', 'alt+1', selectGetHandler);
    $(document).bind('keydown', 'alt+2', selectPostHandler);
    $(document).bind('keydown', 'alt+3', selectPutHandler);
    $(document).bind('keydown', 'alt+4', selectDeleteHandler);
    $(document).bind('keydown', 'alt+5', selectHeadHandler);
    $(document).bind('keydown', 'alt+6', selectOptionsHandler);
    $(document).bind('keydown', 'alt+c', clearHistoryHandler);
    $(document).bind('keydown', 'backspace', urlFocusHandler);
    $(document).bind('keydown', 'alt+n', newRequestHandler);

    $(document).bind('keydown', 'h', function () {
        $('#headers-ParamsFields div:first-child input:first-child').focus();
        return false;
    });

    $(document).bind('keydown', 'return', function () {
        sendRequest();
        return false;
    });

    $(document).bind('keydown', 'p', function () {
        if (postman.currentRequest.isMethodWithBody(postman.currentRequest.method)) {
            $('#body-ParamsFields div:first-child input:first-child').focus();
            return false;
        }
    });

    $(document).bind('keydown', 'f', function () {
        toggleResponseBodySize();
    });

    $(document).bind('keydown', 'shift+/', function () {
        showModal('modalShortcuts');
    });

    $(document).bind('keydown', 'a', function () {
        $('#formModalAddToCollection').modal({
            keyboard:true,
            backdrop:"static"
        });
        $('#formModalAddToColllection').modal('show');
        $('#selectCollectionContainer').focus();

        //Focus on the form element
        return false;
    });
}

function setHeadersParamString(headers) {
    var headersLength = headers.length;
    var paramString = "";
    for (var i = 0; i < headersLength; i++) {
        var h = headers[i];
        if (h.name && h.name !== "") {
            paramString += h.name + ": " + h.value + "\n";
        }
    }
    $('#headers').val(paramString);
}

function processBasicAuthRequestHelper() {
    var headers = postman.currentRequest.headers;

    var headersLength = headers.length;
    var pos = -1;

    //Improve this or put it inside a function
    for (var i = 0; i < headersLength; i++) {
        var h = headers[i];
        if (h.name === "Authorization") {
            pos = i;
            break;
        }
    }

    var authHeaderKey = "Authorization";
    var username = $('#requestHelper-basicAuth-username').val();
    var password = $('#requestHelper-basicAuth-password').val();
    var rawString = username + ":" + password;
    var encodedString = "Basic " + btoa(rawString);

    if (pos >= 0) {
        headers[pos] = {
            name:"Authorization",
            value:encodedString
        };
    }
    else {
        headers.push({name:"Authorization", value:encodedString});
    }

    postman.currentRequest.headers = headers;
    setHeadersParamString(headers);
    showParamsEditor("headers");
}

function hideRequestHelper(type) {
    $('#requestHelpers').css("display", "none");

    if (type === 'basicAuth') {
        processBasicAuthRequestHelper();
    }
    else if (type === 'oAuth1') {
        processOAuth1RequestHelper();
    }
    return false;
}

function showRequestHelper(type) {
    $("#requestTypes ul li").removeClass("active");
    $('#requestTypes ul li[data-id=' + type + ']').addClass('active');
    if (type != "normal") {
        $('#requestHelpers').css("display", "block");
    }
    else {
        $('#requestHelpers').css("display", "none");
    }

    if (type.toLowerCase() === 'oauth1') {
        generateOAuth1RequestHelper();
    }

    $('.requestHelpers').css("display", "none");
    $('#requestHelper-' + type).css("display", "block");
    return false;
}

function setupRequestHelpers() {
    $("#requestTypes ul li").bind("click", function () {
        $("#requestTypes ul li").removeClass("active");
        $(this).addClass("active");
        var type = $(this).attr('data-id');
        showRequestHelper(type);
    });
}

function generateOAuth1RequestHelper() {
    $('#requestHelper-oauth1-timestamp').val(OAuth.timestamp());
    $('#requestHelper-oauth1-nonce').val(OAuth.nonce(6));
}

function generateSignature() {
    if ($('#url').val() == '') {
        $('#requestHelpers').css("display", "block");
        alert('Please enter the URL first.');
        return null;
    }
    var message = {
        action:$('#url').val().trim(),

        //TODO Change this to use postman.currentRequest.method
        method:$('#methods li.active a').html(),
        parameters:[]
    };
    //all the fields defined by oauth
    $('input.signatureParam').each(function () {
        if ($(this).val() != '') {
            message.parameters.push([$(this).attr('key'), $(this).val()]);
        }
    });
    //all the extra GET parameters
    $('#body-ParamsFields input.key, #url-ParamsFields input.key').each(function () {
        if ($(this).val() != '') {
            message.parameters.push([$(this).val(), $(this).next().val()]);
        }
    });

    var accessor = {};
    if ($('input[key="oauth_consumer_secret"]').val() != '') {
        accessor.consumerSecret = $('input[key="oauth_consumer_secret"]').val();
    }
    if ($('input[key="oauth_token_secret"]').val() != '') {
        accessor.tokenSecret = $('input[key="oauth_token_secret"]').val();
    }

    return OAuth.SignatureMethod.sign(message, accessor);
}

function setBodyParamString(url, params) {
    var paramsLength = params.length;
    var paramArr = [];
    for (var i = 0; i < paramsLength; i++) {
        var p = params[i];
        if (p.name && p.name !== "") {
            paramArr.push(p.name + "=" + p.value);
        }
    }
    $('#body').val(paramArr.join('&'));
}

function setUrlParamString(url, params) {
    var paramArr = [];
    var urlParams = getUrlVars(url);
    var p;
    var i;
    for (i = 0; i < urlParams.length; i++) {
        p = urlParams[i];
        if (p.key && p.key !== "") {
            paramArr.push(p.key + "=" + p.value);
        }
    }
    for (i = 0; i < params.length; i++) {
        p = params[i];
        if (p.name && p.name !== "") {
            paramArr.push(p.name + "=" + p.value);
        }
    }

    var baseUrl = url.split("?")[0];
    $('#url').val(baseUrl + "?" + paramArr.join('&'));
}

function processOAuth1RequestHelper() {
    var params = [];

    var signatureKey = "oauth_signature";
    var signature = generateSignature();
    if (signature == null) {
        return;
    }

    params.push({name:signatureKey, value:signature});

    $('input.signatureParam').each(function () {
        if ($(this).val() != '') {
            params.push({name:$(this).attr('key'), value:$(this).val()});
        }
    });

    if (postman.currentRequest.method === "get") {
        var url = $('#url').val();
        //postman.currentRequest.headers = body + ;
        setUrlParamString(url, params);
        showParamsEditor("url");
    } else {
        var body = postman.currentRequest.body;
        //postman.currentRequest.headers = body + ;
        setBodyParamString(body, params);
        showParamsEditor("body");
    }

}

$(document).ready(function () {
    setupDB();
    initDB();
    initializeSettings();
    init();

    $('a[rel="tooltip"]').tooltip();

    addUrlAutoComplete();
    setupKeyboardShortcuts();
    initCollectionSelector();
    postman.interface.setLayout();
    setupRequestHelpers();
    showParamsEditor("headers");

    $('#formAddToCollection').submit(function () {
        submitAddToCollectionForm();
        return false;
    });

    $('#formNewCollection').submit(function () {
        submitNewCollectionForm();
        return false;
    });

    $(window).resize(function () {
        postman.interface.setLayout();
    });

    CodeMirror.defineMode("links", function (config, parserConfig) {
        var linksOverlay = {
            startState:function () {
                return {
                    link:"",
                    pos:0
                }
            },

            token:function (stream, state) {
                if (stream.eatSpace()) {
                    return null;
                }

                //@todo Needs to be improved
                if (matches = stream.match(/https?:\/\/[^'"]*(?=[<"'\n\t\s])/, false)) {
                    //Eat all characters before http link
                    var m = stream.match(/.*(?=https?)/, true);
                    if (m) {
                        if (m[0].length > 0) {
                            return null;
                        }
                    }

                    var pos = stream.string.search(matches[0]);
                    var currentPos = stream.current().search(matches[0]);

                    while (currentPos < 0) {
                        var ch = stream.next();
                        if (ch == "\"" || ch == "'") {
                            stream.backUp(1);
                            break;
                        }

                        if (ch == null) {
                            break;
                        }

                        currentPos = stream.current().search(matches[0]);
                    }

                    return "link";
                }

                stream.skipToEnd();
            }
        };

        return CodeMirror.overlayParser(CodeMirror.getMode(config, parserConfig.backdrop || postman.editor.mode), linksOverlay);
    });

    $('#respData').on("click", ".cm-link", function () {
        var link = $(this).html();
        postman.loadNewRequestFromLink(link);
    });

    $('#modalAboutPostman').click(function () {
        postman.interface.attachSocialButtons();
        return false;
    });
});