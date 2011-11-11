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

var keyItemCount = "imRestClient.itemCount";
var keyItemBase = "imRestClient.item";
var keyRequests = "imRestClient.requests";
var requests;
var bodyFileData;
var dataMode = "params";
var requestStartTime = 0;
var requestEndTime = 0;
var requestMethod = 'GET';
var dataInputType = "text";

var postman = {};
postman.indexedDB = {};
postman.indexedDB.db = null;

// IndexedDB implementations still use API prefixes
var indexedDB = window.indexedDB || // Use the standard DB API
    window.mozIndexedDB || // Or Firefox's early version of it
    window.webkitIndexedDB;            // Or Chrome's early version
// Firefox does not prefix these two:
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;

function clearFields() {
    $("#response").css("display", "");
    $("#loader").css("display", "");
    $("#responsePrint").css("display", "none");

    $("#responseStatus").html("");
    $("#responseHeaders").val("");
    $("#codeData").text("");

    $("#responseHeaders").height(20);
    $("#postputdata").height(20);

    $("#respHeaders").css("display", "none");
    $("#respData").css("display", "none");

    $('#codeData').attr('data-formatted', 'false');
}

function handleFileSelect(evt) {
    var files = evt.target.files;
    var reader = new FileReader();
    var f = files[0];

    reader.onload = (function(theFile) {
        return function(e) {
            bodyFileData = e.target.result;
        };
    })(f);
    reader.readAsText(f);
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
    console.log("Send request called");

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
                }

                //Check if a file is being sent
                xhr.send(bodyData);
            } else {
                xhr.send();
            }

            requestStartTime = new Date().getTime();

            saveRequest(url, method, $("#headers").val(), data);

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
            $("#codeData").html(jQuery.trim(this.responseText).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));

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

    //Initialize the localStarage requsts array if not present
    if (!localStorage[keyRequests]) {
        var r = [];
        localStorage[keyRequests] = JSON.stringify(r);
    }

    $('#langFormat').change(function() {
        var format = $('#language').val();
        setResponseFormat(format);
    })
}

function setupDB() {
    postman.indexedDB.open = function() {
        console.log("Trying to open db");
        var request = indexedDB.open("requests", "POSTman request history");
        request.onsuccess = function(e) {
            var v = "0.3";
            postman.indexedDB.db = e.target.result;
            var db = postman.indexedDB.db;
            console.log(db);
            //We can only create Object stores in a setVersion transaction
            if (v != db.version) {
                console.log("Version is not the same");
                var setVrequest = db.setVersion(v);
                setVrequest.onfailure = postman.indexedDB.onerror;
                setVrequest.onsuccess = function(e) {
                    if (db.objectStoreNames.contains("request")) {
                        db.deleteObjectStore("request");
                    }

                    var store = db.createObjectStore("request", {keyPath: "id"});
                    postman.indexedDB.getAllRequestItems();
                };
            }
            else {
                postman.indexedDB.getAllRequestItems();
            }

        };

        request.onfailure = postman.indexedDB.onerror;
    };

    postman.indexedDB.addRequest = function(id, url, method, headers, data) {
        console.log("Saving request to indexed DB");
        
        var db = postman.indexedDB.db;
        var trans = db.transaction(["request"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("request");

        var request = store.put({
            "id": id,
            "url": url.toString(),
            "method": method.toString(),
            "headers": headers.toString(),
            "data": data.toString(),
            "timestamp": new Date().getTime()
        });

        request.onsuccess = function(e) {
            //Re-render all the todos
            console.log("Added element to requests list", request);
            renderRequestToSidebar(url,  method, id, "top");
        };

        request.onerror = function(e) {
            console.log(e.value);
        }
    };

    postman.indexedDB.getRequest = function(id) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["request"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("request");

        //Get everything in the store
        var cursorRequest = store.get(id);

        console.log("Getting request for " + id);
        
        cursorRequest.onsuccess = function(e) {
            var result = e.target.result;
            if (!!result == false)
                return;

            console.log("Request ", result);
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
        
        var trans = db.transaction(["request"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("request");

        //Get everything in the store
        var keyRange = IDBKeyRange.lowerBound(0);
        var cursorRequest = store.openCursor(keyRange);

        cursorRequest.onsuccess = function(e) {
            var result = e.target.result;
            if (!!result == false)
                return;

            console.log("Request ", result.value);
            var request = result.value;
            renderRequestToSidebar(request.url, request.method, request.id, "top");
            result.continue();
        };

        console.log("Getting all to do times", cursorRequest, keyRange);

        cursorRequest.onerror = postman.indexedDB.onerror;
    };

    postman.indexedDB.deleteRequest = function(id) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["request"], IDBTransaction.READ_WRITE, 0);
        var store = trans.objectStore(["request"]);

        var request = store.delete(id);

        request.onsuccess = function(e) {
            removeRequestFromSidebar(id);
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
function saveRequest(url, method, headers, data) {
    var id = guid();
    postman.indexedDB.addRequest(id, url, method, headers, data);
}

function renderRequestToSidebar(url, method, id, position) {
    url = limitStringLineWidth(url, 55);
    var itemString = "<li id=\"itemContainer-" + id + "\" class=\"clearfix\">";
    itemString += "<div class=\"left clearfix\"><a href=\"javascript:void(0);\"";
    itemString += " onclick=\"loadRequest('" + id + "')\" ";
    itemString += "class=\"itemLink\" id=\"item-" + id + "\">";
    itemString += url + "</a>";
    itemString += "</div><div>";
    itemString += " <a href=\"javascript:void(0);\"";
    itemString += " onclick=\"deleteRequest('" + id + "')\" ";
    itemString += "class=\"itemDeleteLink\" id=\"itemDeleteLink-" + id + "\">";
    itemString += "<img src=\"images/delete.png\"/>";
    itemString += "</a></div>";
    method = method.toUpperCase();
    itemString += " <span class=\"itemRequestType\">" + method + "</span>";

    itemString += "</li>";

    if (position === 'top') {
        $("#historyItems").prepend(itemString);
    }
    else {
        $("#historyItems").append(itemString);
    }
    addHistoryListeners();
}

function removeRequestFromSidebar(id) {
    $('#itemContainer-' + id).slideUp(100);
}

function loadRequest(id) {
    postman.indexedDB.getRequest(id);
}

function loadRequestInEditor(request) {
    var method = request.method.toLowerCase();

    $('#url').val(request.url);

    //Set proper class for method and the variable

    $('#headers').val(request.headers);
    $('#urlParamsEditor').css("display", "none");
    $('#response').css("display", "none");

    closeParamsEditor("body");
    $('#body').val("")

    if (method === 'post' || method === 'put') {
        $('#data').val(request.data);
        $('#data').css("display", "block");
        showBodyParamsEditor();
    }
    else {
        $('#data').css("display", "none");
        closeParamsEditor("body");
    }

    $('#methods ul li').removeClass('active');
    $('#method-' + method).parent().addClass('active');
    requestMethod = method;

    closeParamsEditor("url");
    clearResponse();
}

function clearResponse() {
    $('#responseStatus').css("display", "none");
    $('#responseHeaders').css("display", "none");
    $('#codeData').css("display", "none");
}

function deleteRequest(id) {
    postman.indexedDB.deleteRequest(id);
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
    if (url == null) {
        return "";
    }

    var vars = [], hash;
    var hashes = url.slice(url.indexOf('?') + 1).split('&');

    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }

    return vars;
}

function getHeaderVars(data) {
    if (data == null) {
        return "";
    }

    var vars = [], hash;
    var hashes = data.split('\n');

    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split(":");
        vars[hash[0]] = jQuery.trim(hash[1]);
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
    console.log(data);
    var params;
    if (section === 'headers') {
        params = getHeaderVars(data);
    }
    else {
        params = getUrlVars(data);
    }

    var editorHtml = "";
    var i = 0;

    //@todo Replace this with jquery templates

    for (var index in params) {
        if (params[index] == undefined) continue;
        editorHtml += "<div>";
        editorHtml += "<input type=\"text\" data-section=\"" + section + "\" name=\"" + section + "[key][]\" class=\"key\" placeholder=\"key\" value=\"" + index + "\"/>";
        editorHtml += "<input type=\"text\" name=\"" + section + "[value][]\" class=\"value\" placeholder=\"value\" value=\"" + params[index] + "\"/>";
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
}

function removeBodyListeners() {
    $('#body').unbind("focus");
    $('#body').unbind("blur");
}

function setContainerHeights() {
    var mainHeight = $('#main-scroller').height();
    var historyHeight = $('#history').height();

    var maxHeight = mainHeight > historyHeight ? mainHeight : historyHeight;
    var docHeight = $(document).height();

    $('#history').height(maxHeight + "px");

}

$(document).ready(function() {
    setupDB();
    initDB();
    lang();
    init();

    postman.indexedDB.getAllRequestItems();
    addHeaderListeners();
    setContainerHeights();

    $('#methods ul li a').click(function() {
        $('#methods ul li').removeClass('active');
        $(this).parent().addClass('active');
        requestMethod = $(this).attr('data-method');
    });

    $(window).resize(function() {
        setContainerHeights();
    });
});


function addHistoryListeners() {
    $('#historyItems li').mouseenter(function() {
        var deleteEl = jQuery('.itemDeleteLink', this);
        var methodEl = jQuery('.itemRequestType', this);
        deleteEl.css('display', 'block');
        methodEl.css('display', 'block');
    });

    $('#historyItems li').mouseleave(function() {
        var deleteEl = jQuery('.itemDeleteLink', this);
        var methodEl = jQuery('.itemRequestType', this);
        deleteEl.css('display', 'none');
        methodEl.css('display', 'none');
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
                newElementHtml += '<input type="file" name="body[value][]" multiple/>';
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

    var containerHtml = '<textarea name="data" id="body" tabindex="4" class="inputText"></textarea>';
    $('#bodyDataContainer').html(containerHtml);

    setCurrentDataFormat('params');
    removeBodyListeners();
    addBodyListeners();
}

function showRawEditor() {
    dataMode = "raw";
    closeParamsEditor('body');

    setCurrentDataFormat('raw');
    var containerHtml = '<textarea name="data" id="body" tabindex="4" class="inputText"></textarea>';
    $('#bodyDataContainer').html(containerHtml);

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

function setResponseFormat(format) {
    $('#codeData').removeClass();
    $('#codeData').addClass('chili-lang-' + format);

    var val = $('#codeData').html();
    var isFormatted = $('#codeData').attr('data-formatted');

    if (format === 'javascript' && isFormatted === 'false') {
        var jsonObject = JSON.parse(val);
        var text = JSON.stringify(jsonObject, null, '\t');
        $('#codeData').html(text);
        $('#codeData').attr('data-formatted', 'true');
    }

    $.chili.options.automatic.active = true;
    var $chili = $('#codeData').chili();
}