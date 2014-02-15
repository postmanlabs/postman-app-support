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
"use strict";
function Collection() {
    this.id = "";
    this.name = "";
    this.requests = {};
}

function CollectionRequest() {
    this.collectionId = "";
    this.id = "";
    this.name = "";
    this.description = "";
    this.url = "";
    this.method = "";
    this.headers = "";
    this.data = "";
    this.dataMode = "params";
    this.timestamp = 0;
}

function Request() {
    this.id = "";
    this.name = "";
    this.description = "";
    this.url = "";
    this.method = "";
    this.headers = "";
    this.data = "";
    this.dataMode = "params";
    this.timestamp = 0;
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

var pm = {};

pm.debug = true;

pm.indexedDB = {};
pm.indexedDB.db = null;
pm.indexedDB.modes = {
    readwrite:"readwrite",
    readonly:"readonly"
};

pm.fs = {};
pm.webUrl = "http://getpostman.com";
pm.bannedHeaders = [
    'accept-charset',
    'accept-encoding',
    'access-control-request-headers',
    'access-control-request-method',
    'connection',
    'content-length',
    'cookie',
    'cookie2',
    'content-transfer-encoding',
    'date',
    'expect',
    'host',
    'keep-alive',
    'origin',
    'referer',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'user-agent',
    'via'
];

// IndexedDB implementations still use API prefixes
var indexedDB = window.indexedDB || // Use the standard DB API
    window.mozIndexedDB || // Or Firefox's early version of it
    window.webkitIndexedDB;            // Or Chrome's early version
// Firefox does not prefix these two:
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
var IDBCursor = window.IDBCursor || window.webkitIDBCursor;

window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

/*
 Components

 history - History of sent requests. Can be toggled on and off
 collections - Groups of requests. Can be saved to a file. Saved requests can have a name and description to document
 the request properly.
 settings - Settings Postman behavior
 layout - Manages quite a bit of the interface
 currentRequest - Everything to do with the current request loaded in Postman. Also manages sending, receiving requests
 and processing additional parameters
 urlCache - Needed for the autocomplete functionality
 helpers - Basic and OAuth helper management. More helpers will be added later.
 keymap - Keyboard shortcuts
 envManager - Environments to customize requests using variables.
 filesystem - Loading and saving files from the local filesystem.
 indexedDB - Backend database. Right now Postman uses indexedDB.

 Plugins

 keyvaleditor - Used for URL params, headers and POST params.

 Dependencies

 jQuery
 jQuery UI - AutoComplete plugin
 jQuery HotKeys
 jQuery jScrollPane
 jQuery MouseWheel
 Bootstrap
 CodeMirror
 Underscore

 Code status

 I am not exactly happy with the code I have written. Most of this has resulted from rapid UI
 prototyping. I hope to rewrite this using either Ember or Backbone one day! Till then I'll be
 cleaning this up bit by bit.
 */

pm.init = function () {
    Handlebars.partials = Handlebars.templates;
    pm.history.init();
    pm.collections.init();
    pm.settings.init();
    pm.layout.init();
    pm.editor.init();
    pm.jsonlint.init();
    pm.request.init();
    pm.urlCache.refreshAutoComplete();
    pm.helpers.init();
    pm.keymap.init();
    pm.envManager.init();
    pm.filesystem.init();
    pm.indexedDB.open();
    pm.broadcasts.init();
    $(":input:first").focus();
};

$(document).ready(function () {
    pm.init();
});

$(window).on("unload", function () {
    pm.request.saveCurrentRequestToLocalStorage();
});
