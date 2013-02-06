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

// http://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function string2ArrayBuffer(string, callback) {
    var bb = new Blob([string]);
    var f = new FileReader();
    f.onload = function (e) {
        callback(e.target.result);
    };
    f.readAsArrayBuffer(bb);
}

function find(collection, filter) {
    for (var i = 0; i < filter.length; i++) {
        if (filter(collection[i], i, collection)) {
            console.log(i);
            return i;
        }
    }
    return -1;
}