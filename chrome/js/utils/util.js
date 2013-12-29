function gapiIsLoaded() {

}

function isMethodWithBody(method) {
    var methodsWithBody = ["POST", "PUT", "PATCH", "DELETE", "LINK", "UNLINK"];
    method = method.toUpperCase();
    return $.inArray(method, methodsWithBody) >= 0;
}

function sortAscending(a, b) {
    if (a >= b) {
        return 1;
    }
    else {
        return -1;
    }
}

function sortById(a, b) {
    var aName = a.id;
    var bName = b.id;

    if (aName < bName) {
        return 1;
    }
    else if (aName === bName) {
        return 0;
    }
    else {
        return -1;
    }
}

function sortAlphabetical(a, b) {
    var counter;
    if (a.name.length > b.name.legnth)
        counter = b.name.length;
    else
        counter = a.name.length;

    for (var i = 0; i < counter; i++) {
        if (a.name[i] == b.name[i]) {
            continue;
        } else if (a.name[i] > b.name[i]) {
            return 1;
        } else {
            return -1;
        }
    }
    return 1;
}

$.widget("custom.catcomplete", $.ui.autocomplete, {
    _renderMenu:function (ul, items) {
        var that = this,
            currentCategory = "";
        $.each(items, function (index, item) {
            if (item.category != currentCategory) {
                ul.append("<li class='ui-autocomplete-category'>" + item.category + "</li>");
                currentCategory = item.category;
            }
            that._renderItemData(ul, item);
        });
    }
});

function findPosition(list, key, value) {
    var listLength = list.length;
    var pos = -1;
    for (var i = 0; i < listLength; i++) {
        var h = list[i];
        if (h['key'] === value) {
            pos = i;
            break;
        }
    }

    return pos;
}

function limitStringLineWidth(string, numChars) {
    string = string.replace("&", "&amp;");
    var remainingChars = string;
    var finalString = "";
    var numLeft = string.length;
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

function ensureProperUrl(url) {
    var a = "http";
    if (url.indexOf(a) != 0) {
        url = "http://" + url;
    }
    return url;
}

function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}
function guid() {
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function getBodyVars(url, associative) {
    if (url === null) {
        return [];
    }

    var equalLocation = url.indexOf('=');

    if (equalLocation < 0) {
        return [];
    }

    var vars = [], hash, varsAssoc = {};
    var hashes = url.split('&');
    var element;

    for (var i = 0; i < hashes.length; i++) {
        equalLocation = hashes[i].indexOf('=');

        if (equalLocation !== -1) {
            element = {
                "key":hashes[i].slice(0, equalLocation),
                "value":hashes[i].slice(equalLocation + 1)
            };
        }
        else {
            element = {
                "key":hashes[i].slice(0, hashes[i].length),
                "value":""
            };
        }


        (associative) ? (varsAssoc[element.key] = element.value) : (vars.push(element));
    }

    if (associative) {
        return varsAssoc;
    } else {
        return vars;
    }
}

function getUrlVars(url, associative) {
    if (url === null) {
        return [];
    }

    var quesLocation = url.indexOf('?');
    var equalLocation = url.indexOf('=');

    if (equalLocation < 0) {
        return [];
    }

    if (quesLocation < 0) {
        quesLocation = -1;
        return [];
    }

    var vars = [], hash, varsAssoc = {};
    var hashes = url.slice(quesLocation + 1).split('&');
    var element;

    for (var i = 0; i < hashes.length; i++) {
        equalLocation = hashes[i].indexOf('=');

        if (equalLocation !== -1) {
            element = {
                "key":hashes[i].slice(0, equalLocation),
                "value":hashes[i].slice(equalLocation + 1)
            };
        }
        else {
            element = {
                "key":hashes[i].slice(0, hashes[i].length),
                "value":""
            };
        }

        (associative) ? (varsAssoc[element.key] = element.value) : (vars.push(element));
    }

    if (associative) {
        return varsAssoc;
    } else {
        return vars;
    }
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
            "key":jQuery.trim(hash[0]),
            "value":jQuery.trim(hash[1])
        };

        vars.push(header);
    }

    return vars;
}

function valuesFollowingInputValue(value) {
    return $('input[value="' + value + '"] + input').val()
}

// http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
 }

function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);

    for (var i=0, strLen=str.length; i<strLen; i++) {
     bufView[i] = str.charCodeAt(i);
    }

    return buf;
 }

function find(collection, filter) {
    for (var i = 0; i < filter.length; i++) {
        if (filter(collection[i], i, collection)) {
            return i;
        }
    }
    return -1;
}

function copyToClipboard(text){
    var copyDiv = document.createElement('textarea');
    copyDiv.contentEditable = true;
    document.body.appendChild(copyDiv);
    copyDiv.innerHTML = text;
    copyDiv.unselectable = "off";
    copyDiv.focus();
    document.execCommand('selectall');
    document.execCommand("copy", false, null);
    document.body.removeChild(copyDiv);
}

//Usage arrayObjectIndexOf(items, "Washington", "city");
function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}

//http://stackoverflow.com/questions/1219860/javascript-jquery-html-encoding
function htmlEncode(value){
  //create a in-memory div, set it's inner text(which jQuery automatically encodes)
  //then grab the encoded contents back out.  The div never exists on the page.
  return $('<div/>').text(value).html();
}

// http://stackoverflow.com/questions/1527803/generating-random-numbers-in-javascript-in-a-specific-range
/**
 * Returns a random number between min and max
 */
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min and max
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function splitSyncableFilename(name) {
    var parts = name.split(".");
    return {
        "id": parts[0],
        "type": parts[1]
    };
}

/*
    Get path variables from the URL
*/

function getURLPathVariables(url) {
    if (!url) {
        return [];
    }

    var quesLocation = url.indexOf('?');
    var strippedUrl;

    if (quesLocation > 0) {
        strippedUrl = url.substr(0, quesLocation);
    }
    else {
        strippedUrl = url;
    }

    var pattern = /\/:[0-9A-Za-z_-]*/ig;

    var matches = strippedUrl.match(pattern);
    var pairs = [];
    var i;
    var s;

    if (matches) {
        for(i = 0; i < matches.length; i++) {
            s = matches[i].substr(2);
            pairs.push(s);
        }
    }

    return pairs;
}

/*
    Replace path variables with values
*/
function replaceURLPathVariables(url, values) {
    if (!url) {
        return url;
    }

    var quesLocation = url.indexOf('?');
    var strippedUrl;

    if (quesLocation > 0) {
        strippedUrl = url.substr(0, quesLocation);
    }
    else {
        strippedUrl = url;
    }

    var pattern = /\/:[0-9A-Za-z_-]*/ig;

    var matches = strippedUrl.match(pattern);
    var pairs = [];
    var i;
    var key;
    var val;

    var finalUrl = url;

    if (matches) {
        for(i = 0; i < matches.length; i++) {
            key = matches[i].substr(2);

            if (key in values) {
                val = '/' + values[key];
                finalUrl = finalUrl.replace('/:' + key, val);
            }
        }
    }

    console.log(finalUrl);
    return finalUrl;
}

function stringToUint8Array(string) {
    var buffer = new ArrayBuffer(string.length);
    var view = new Uint8Array(buffer);
    for(var i = 0; i < string.length; i++) {
        view[i] = string.charCodeAt(i);
    }
    return view;
};

function arrayBufferToString(buffer) {
    var str = '';
    var uArrayVal = new Uint8Array(buffer);
    for(var s = 0; s < uArrayVal.length; s++) {
        str += String.fromCharCode(uArrayVal[s]);
    }

    return str;
};