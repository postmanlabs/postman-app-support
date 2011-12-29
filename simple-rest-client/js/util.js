/**
 * Created by PyCharm.
 * User: ankit
 * Date: 29/12/11
 * Time: 2:59 AM
 * To change this template use File | Settings | File Templates.
 */
function getUrlVars(url, associative) {
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

    var vars = [], hash, varsAssoc = {};
    var hashes = url.slice(quesLocation + 1).split('&');
    var element;

    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        element = {
            "key": jQuery.trim(hash[0]),
            "value": jQuery.trim(hash[1])
        };
        (associative == true)?(varsAssoc[element.key] =element.value):(vars.push(element));
    }

    if (associative == true) {
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
            "key": jQuery.trim(hash[0]),
            "value": jQuery.trim(hash[1])
        };

        vars.push(header);
    }

    return vars;
}