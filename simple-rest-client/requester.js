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
    $("#headers").height(20);
    $("#postputdata").height(20);

    $("#respHeaders").css("display", "none");
    $("#respData").css("display", "none");
}

function sendRequest() {
    clearFields();
    if ($("#url").val() != "") {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = readResponse;
        try {
            xhr.open($("input[type=radio]:checked").val(), $("#url").val(), true);
            var headers = $("#headers").val();

            var url = $("#url").val();
            var method = $("input[type=radio]:checked").val();
            var data = "";

            headers = headers.split("\n");
            for (var i = 0; i < headers.length; i++) {
                var header = headers[i].split(": ");
                if (header[1])
                    xhr.setRequestHeader(header[0], header[1]);
            }

            if (jQuery.inArray($("input[type=radio]:checked").val(), ["post", "put"]) > -1) {
                xhr.send($("#body").val());
                data = $("#body").val();
            } else {
                xhr.send("");
            }

            saveRequest(url, method, headers, data);
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
}

function readResponse() {
    grow('headers');
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

            $.chili.options.automatic.active = false;
            $.chili.options.decoration.lineNumbers = false;
            var $chili = $('#codeData').chili();
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
    } else {
        $("#data").css("display", "none");
    }
}

function init() {
    $("#url").width($("#purl").width() - 80 - 30);
    $("#headers").width($("#pheaders").width() - 80 - 30);
    $("#body").width($("#data").width() - 80 - 30);

    $("#responseHeaders").width($("#respHeaders").width() - 80 - 30);
    $("#responseData").width($("#respHeaders").width() - 80 - 30);

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
    if(!localStorage[keyRequests]) {
        var r = [];
        localStorage[keyRequests] = JSON.stringify(r);
    }

}

//History management functions
function saveRequest(url, method, headers, data) {
    var id = guid();
    var requestItem = {
        "id": id,
        "url": url,
        "method": method,
        "headers": headers,
        "data": data
    };

    requests[requests.length] = requestItem;
    localStorage[keyRequests] = JSON.stringify(requests);
    addRequestToHistory(url, id, "top");
}

function addRequestToHistory(url, id, position) {
    var itemString = "<li id=\"itemContainer-" + id + "\"><a href=\"javascript:void(0);\"";
    itemString += " onclick=\"loadRequest('" + id + "')\" ";
    itemString += "class=\"itemLink\" id=\"item-" + id + "\">" + url + "</a>";
    itemString += " <a href=\"javascript:void(0);\"";
    itemString += " onclick=\"deleteRequest('" + id + "')\" ";
    itemString += "class=\"itemDeleteLink\" id=\"itemDeleteLink-" + id + "\">" + "Delete" + "</a>";
    itemString += "</a>";
    itemString += "</li>";

    if(position === 'top') {
        $("#historyItems").prepend(itemString);
    }
    else {
        $("#historyItems").append(itemString);
    }

}

function removeRequestFromHistory(id) {
    $('#itemContainer-' + id).fadeOut();
}

function getAllSavedRequests() {
    var url;
    var itemString;
    
    requests = JSON.parse(localStorage[keyRequests]);
    var itemCount = requests.length;

    for(var i = itemCount - 1; i >= 0; i--) {
        url = requests[i].url;
        id = requests[i].id;
        addRequestToHistory(url, id, "bottom");
    }
}

function loadRequest(id) {
    var itemCount = requests.length;
    for(var i = itemCount - 1; i >= 0; i--) {
        if(requests[i].id === id) {
            break;
        }
    }

    var method = requests[i].method;

    $('#url').val(requests[i].url);
    $('input[name="method"]').attr("checked", false);
    $('input[id="' + method + '"]').attr("checked", true);
    $('#headers').val(requests[i].headers);
    $('#urlParamsEditor').css("display", "none");
    $('#bodyParamsEditor').css("display", "none");

    if(method === 'post' || method === 'put') {
        $('#data').val(requests[i].data);
        $('#data').css("display", "block");
    }
    else {
        $('#data').css("display", "none");
    }

    clearResponse();
}

function clearResponse() {
    $('#responseStatus').html('');
    $('#responseHeaders').html('');
    $('#codeData').html('');
}
function deleteRequest(id) {
    var itemCount = requests.length;
    for(var i = itemCount - 1; i >= 0; i--) {
        if(requests[i].id === id) {
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
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}
function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function getUrlVars(url)
{
    var vars = [], hash;
    var hashes = url.slice(url.indexOf('?') + 1).split('&');

    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }

    return vars;
}

function setParamsFromEditor(section) {
    var keys = $('input[id|="' + section + '-key"]');
    var paramString = "";

    $('input[id|="' + section + '-key"]').each(function() {
        var val = $(this).next().val();

        if(val !== "" && $(this).val() !== "") {
            paramString += $(this).val() + "=" + val + "&";
        }
    });

    paramString = paramString.substr(0, paramString.length - 1);

    if(section === 'url') {
        var url = $('#url').val();
        var baseUrl = url.split("?")[0];
        $('#' + section).val(baseUrl + "?" + paramString);
    }
    else if(section === 'body') {
        var body = $('#body').val();
        $('#' + section).val(paramString);
    }

}


function showParamsEditor(section) {
    var url = $('#' + section).val();
    var params = getUrlVars(url);
    var editorHtml = "";
    var i = 0;

    for(var index in params) {
        if(params[index] == undefined) continue;
        editorHtml += "<div id=\"" + section + "Param-" + i + "\">";
        editorHtml += "<input type=\"text\" name=\"key\" id=\"" + section + "-key-" + i + "\" value=\"" + index + "\"/>";
        editorHtml += "<input type=\"text\" name=\"val\" id=\"" + section + "-val-" + i + "\" value=\"" + params[index] + "\"/>";
        editorHtml += "<a href=\"javascript:void(0);\" onclick=\"deleteParam(" + i + ", \"" + section + ")\">Delete</a>";
        editorHtml += "</div>";
        i++;
    }

    $('#' + section + 'ParamsFields').html(editorHtml);
    $('#' + section + 'ParamsEditor').fadeIn();
}

function deleteParam(index, section) {
    $('#' + section + 'Param-' + index).remove();
}

function closeParamsEditor(section) {
    $('#' + section + 'ParamsEditor').fadeOut();
}

function addParamInEditor(section) {
    var newElementHtml = "";
    var i = $('#' + section + 'ParamsFields').children().length;
    newElementHtml += "<div id=\"" + section + "Param-" + i + "\">";
    newElementHtml += "<input type=\"text\" name=\"key\" id=\"" + section + "-key-" + i + "\" value=\"" + "key" + "\"/>";
    newElementHtml += "<input type=\"text\" name=\"val\" id=\"" + section + "-val-" + i + "\" value=\"" + "val" + "\"/>";
    newElementHtml += "<a href=\"javascript:void(0);\" onclick=\"deleteParam(" + i + ", \"" + section + ")\">Delete</a>";
    newElementHtml += "</div>";
    $('#' + section + 'ParamsFields').append(newElementHtml);
}

$(document).ready(function() {
    lang();
    init();
    getAllSavedRequests();
});

