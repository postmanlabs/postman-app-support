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

var pm = {};

pm.targets = {
    CHROME_LEGACY_APP: 0,
    CHROME_PACKAGED_APP: 1
};

pm.target = pm.targets.CHROME_PACKAGED_APP;

pm.isTesting = false;

if (pm.isTesting) {
    pm.databaseName = "postman_test";
    pm.webUrl = "http://localhost/postman/html";
}
else {
    pm.databaseName = "postman";
    pm.webUrl = "http://getpostman.com";
}


pm.debug = true;

pm.indexedDB = {};
pm.indexedDB.db = null;
pm.indexedDB.modes = {
    readwrite:"readwrite",
    readonly:"readonly"
};

pm.fs = {};
pm.hasPostmanInitialized = false;

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

    function initializeCollections() {
        var pmCollections = new PmCollections();

        var addCollectionModal = new AddCollectionModal({model: pmCollections});
        var addFolderModal = new AddFolderModal({model: pmCollections});
        var editFolderModal = new EditFolderModal({model: pmCollections});
        var deleteFolderModal = new DeleteFolderModal({model: pmCollections});
        var editCollectionModal = new EditCollectionModal({model: pmCollections});
        var deleteCollectionModal = new DeleteCollectionModal({model: pmCollections});
        var importCollectionModal = new ImportCollectionModal({model: pmCollections});
        var shareCollectionModal = new ShareCollectionModal({model: pmCollections});
        var overwriteCollectionModal = new OverwriteCollectionModal({model: pmCollections});

        var addCollectionRequestModal = new AddCollectionRequestModal({model: pmCollections});
        var editCollectionRequestModal = new EditCollectionRequestModal({model: pmCollections});
        var deleteCollectionRequestModal = new DeleteCollectionRequestModal({model: pmCollections});
        pm.collections = pmCollections;
    }

    function initializeHistory() {
        var history = new History();
        pm.history = history;
    }

    function initializeHelpers() {
        var basicAuthProcessor = new BasicAuthProcessor({request: pm.request});
        var digestAuthProcessor = new DigestAuthProcessor({request: pm.request});
        var oAuth1Processor = new OAuth1Processor({request: pm.request});

        var helpers = new Helpers({
            "basicAuth": basicAuthProcessor,
            "digestAuth": digestAuthProcessor,
            "oAuth1": oAuth1Processor,
            "request": pm.request
        });

        var helperManager = new HelperManager({model: helpers});
        pm.helpers = helperManager;
    }

    function initializeEnvironments() {
        var globals = new Globals();
        var environments = new Environments();

        var variableProcessor = new VariableProcessor({
            "environments": environments,
            "globals": globals
        });

        var environmentSelector = new EnvironmentSelector({
            "environments": environments,
            "variableProcessor": variableProcessor
        });

        var environmentManagerModal = new EnvironmentManagerModal({
            "environments": environments,
            "globals": globals
        });

        var quicklookPopOver = new QuickLookPopOver({
            "environments": environments,
            "globals": globals,
            "variableProcessor": variableProcessor
        });

        pm.envManager = variableProcessor;

        var appState = new AppState({
            "globals": globals,
            "environments": environments,
            "variableProcessor": variableProcessor
        });

        var appView = new App({model: appState});
        pm.app = appView;
    }

    function initializeHeaderPresets() {
        pm.headerPresets = new HeaderPresets();

        var headerPresetsModal = new HeaderPresetsModal({model: pm.headerPresets});
        var headerPresetsRequestEditor = new HeaderPresetsRequestEditor({model: pm.headerPresets});
    }

    function initializeRequester() {
        var urlCache = new URLCache();
        pm.urlCache = urlCache;

        var request = new Request();
        var requestEditor = new RequestEditor({model: request});
        var responseViewer = new ResponseViewer({model: request});
        pm.request = request;
    }

    function initializeStorage() {
        var storage = new Storage();
        pm.storage = storage;
    }

    function initializeSidebar() {
        var sidebarState = new SidebarState({history: pm.history, collections: pm.collections});
        var sidebar = new Sidebar({ model: sidebarState });
    }

    function initializeDriveSync() {
        pm.driveSync = new DriveSync();
        var driveSyncLogger = new DriveSyncLogger({model: pm.driveSync});
    }

    pm.mediator = new Mediator();

    initializeStorage();
    pm.settings = new Settings();

    pm.settings.init(function() {
        var settingsModal = new SettingsModal({model: pm.settings});
        pm.filesystem.init();
        pm.indexedDB.open(function() {
            initializeRequester();
            initializeHelpers();
            initializeHistory();
            initializeCollections();

            initializeEnvironments();
            initializeHeaderPresets();

            initializeSidebar();

            pm.collections.on("updateCollectionRequest", function(request) {
                pm.request.checkIfCurrentRequestIsUpdated(request);
            });

            pm.broadcasts.init();

            initializeDriveSync();

            pm.hasPostmanInitialized = true;
            console.log("Set hasPostmanInitialized to true");
        });
    });
};

$(document).ready(function () {
    pm.init();
});