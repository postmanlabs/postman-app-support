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

function grow(id) {
    var textarea = document.getElementById(id);
    var newHeight = textarea.scrollHeight;
    var currentHeight = textarea.clientHeight;
    if (newHeight == 0 || $("#" + id).val() == "") {
        newHeight = 20;
    }
    textarea.style.height = newHeight + 'px';
}

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

function getRequestMethod() {
    return requestMethod;
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

                    $('input[name*=body[key]]').each(function() {
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
            $('#notification').fadeIn();
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
    $('#notification').fadeOut();

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

            grow('responseHeaders');

            requestEndTime = new Date().getTime();
            var diff = requestEndTime - requestStartTime;
            $('#ptime span').html(diff + " ms");

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
}

function toggleData() {
    if (jQuery.inArray($("input[type=radio]:checked").val(), ["post", "put"]) > -1) {
        $("#data").css("display", "");
        showBodyParamsEditor();
    } else {
        closeParamsEditor('body')
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

    $("#submit").click(function() {
        sendRequest();
        return false;
    });
    $("#reset").click(function() {
        location.reload();
    });
    $(".radio").change(function() {
        toggleData();
    });
    $(".radio").focus(function() {
        toggleData();
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

function requestExists(requestItem) {
    var index = -1;
    for (var i = 0; i < requests.length; i++) {
        var r = requests[i];
        if (r.url.length != requestItem.url.length ||
            r.headers.length != requestItem.headers.length ||
            r.method != requestItem.method) {
            index = -1;
        }
        else {
            if (r.url === requestItem.url) {
                if (r.headers === requestItem.headers) {
                    index = i;
                }
            }
        }

        if (index >= 0) {
            break;
        }
    }

    return index;
}
//History management functions
function saveRequest(url, method, headers, data) {
    var id = guid();
    var requestItem = {
        "id": id,
        "url": url.toString(),
        "method": method.toString(),
        "headers": headers.toString(),
        "data": data.toString()
    };

    var index = requestExists(requestItem);

    if (index >= 0) {
        removeRequestFromHistory(requests[index].id);
        requests.splice(index, 1);
    }

    //TODO Not sure how heavy this is
    requests[requests.length] = requestItem;
    localStorage[keyRequests] = JSON.stringify(requests);
    addRequestToHistory(url, method, id, "top");
    addHistoryListeners();
}

function addRequestToHistory(url, method, id, position) {
    var itemString = "<li id=\"itemContainer-" + id + "\" class=\"clearfix\">";
    itemString += "<div class=\"left\"><a href=\"javascript:void(0);\"";
    itemString += " onclick=\"loadRequest('" + id + "')\" ";
    itemString += "class=\"itemLink\" id=\"item-" + id + "\">";
    itemString += url + "</a>";
    itemString += "</div><div class=\"right\">";
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

}

function removeRequestFromHistory(id) {
    $('#itemContainer-' + id).remove();
}

function getAllSavedRequests() {
    var url;
    var itemString;
    var id;
    var method;

    requests = JSON.parse(localStorage[keyRequests]);
    var itemCount = requests.length;

    for (var i = itemCount - 1; i >= 0; i--) {
        url = requests[i].url;
        id = requests[i].id;
        method = requests[i].method;
        addRequestToHistory(url, method, id, "bottom");
    }

    addHistoryListeners();
}

function loadRequest(id) {
    var itemCount = requests.length;
    for (var i = itemCount - 1; i >= 0; i--) {
        if (requests[i].id === id) {
            break;
        }
    }

    var method = requests[i].method;

    $('#url').val(requests[i].url);
    $('input[name="method"]').attr("checked", false);
    $('input[id="' + method + '"]').attr("checked", true);
    $('#headers').val(requests[i].headers);
    $('#urlParamsEditor').css("display", "none");
    $('#response').css("display", "none");

    closeParamsEditor("body");
    $('#body').val("")

    if (method === 'post' || method === 'put') {
        $('#data').val(requests[i].data);
        $('#data').css("display", "block");
        showBodyParamsEditor();
    }
    else {
        $('#data').css("display", "none");
        closeParamsEditor("body");
    }

    closeParamsEditor("url");
    clearResponse();
}

function clearResponse() {
    $('#responseStatus').css("display", "none");
    $('#responseHeaders').css("display", "none");
    $('#codeData').css("display", "none");
}
function deleteRequest(id) {
    var itemCount = requests.length;
    for (var i = itemCount - 1; i >= 0; i--) {
        if (requests[i].id === id) {
            break;
        }
    }

    removeRequestFromHistory(requests[i].id);
    requests.splice(i, 1);
    saveRequestsToLocalStorage();
}

function deleteAllRequests() {
    requests = [];
    saveRequestsToLocalStorage();
    $("#historyItems li").fadeOut();
}

function saveRequestsToLocalStorage() {
    localStorage[keyRequests] = JSON.stringify(requests);
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

function setParamsFromEditor(section) {
    var keys = $('input[id|="' + section + '-key"]');
    var paramString = "";

    $('input[name*=' + section + '[key]]').each(function() {
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
        editorHtml += "<input type=\"text\" name=\"" + section + "[key][]\" class=\"key\" placeholder=\"key\" value=\"" + index + "\"/>";
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
    editorHtml += "<input type=\"text\" name=\"" + section + "[key][]\"";
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
    newElementHtml += "<input type=\"text\" name=\"" + section + "[key][]\" class=\"key\" placeholder=\"" + "key" + "\"/>";
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
        containerHtml += '<input type="text" name="body[key][]" placeholder="key"/>';
        containerHtml += '<input type="file" name="body[value][]" multiple/>';
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
}

$(document).ready(function() {
    lang();
    init();
    getAllSavedRequests();
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
            newElementHtml += "<input type=\"text\" name=\"" + section + "[key][]\" class=\"key\" placeholder=\"" + "key" + "\"/>";

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

function showBodyParamsEditor() {
    dataMode = "params";
    showParamsEditor('body');
    $('#bodyParamsButton').css('opacity', 1);
    $('#bodyFileButton').css('opacity', 0.5);
    $('#bodyRawButton').css('opacity', 0.5);

    var containerHtml = '<textarea name="data" id="body" tabindex="4" class="inputText"></textarea>';
    $('#bodyDataContainer').html(containerHtml);

    removeBodyListeners();
    addBodyListeners();
}

function showRawEditor() {
    dataMode = "raw";
    closeParamsEditor('body');
    $('#bodyParamsButton').css('opacity', 0.5);
    $('#bodyFileButton').css('opacity', 0.5);
    $('#bodyRawButton').css('opacity', 1);

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