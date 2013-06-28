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

//TODO: Remove these model classes
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

var pm = {};

pm.targets = {
    CHROME_LEGACY_APP: 0,
    CHROME_PACKAGED_APP: 1    
};

pm.target = pm.targets.CHROME_PACKAGED_APP;

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


pm.init = function () {
    Handlebars.partials = Handlebars.templates;

    pm.settings.init(function() {           
        pm.indexedDB.open(function() {
            pm.request.init();
            pm.history.init();
            pm.collections.init();        
            pm.search.init();
            pm.layout.init();
            pm.editor.init();
            pm.helpers.init();
            pm.keymap.init();            
            pm.envManager.init();
            pm.filesystem.init();

            
            pm.history.getAllRequests();
            pm.envManager.getAllEnvironments();
            pm.headerPresets.init();
            pm.helpers.loadFromDB();

            var activeSidebarSection = pm.settings.get("activeSidebarSection");

            if (activeSidebarSection) {
                pm.layout.sidebar.select(activeSidebarSection);    
            }        
            else {
                pm.layout.sidebar.select("history");
            }
        });

        pm.drive.setupUiHandlers();
        pm.broadcasts.init();
        
        $(":input:first").focus();
    });    
};

$(document).ready(function () {
    pm.init();
});