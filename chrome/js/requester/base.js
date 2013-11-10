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

pm.isTesting = postman_flag_is_testing;
pm.databaseName = postman_database_name;
pm.webUrl = postman_web_url;

pm.features = new Features();

pm.debug = false;

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

    function initializeTCPReader() {
        var tcpReader = new TCPReader();
        var tcpReaderStatus = new TCPReaderStatus({model: tcpReader});
        var tcpManager = new TCPManager({model: tcpReader});

        pm.tcpReader = tcpReader;
    }

    function initializePostmanAPI() {
        pm.api = new PostmanAPI();
    }

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

        var basicAuthProcessor = new BasicAuthProcessor({request: request});
        var digestAuthProcessor = new DigestAuthProcessor({request: request});
        var oAuth1Processor = new OAuth1Processor({request: request});
        var oAuth2TokenFetcher = new OAuth2TokenFetcher({request: request});

        var helpers = new Helpers({
            "basicAuth": basicAuthProcessor,
            "digestAuth": digestAuthProcessor,
            "oAuth1": oAuth1Processor,
            "oAuth2": oAuth2TokenFetcher,
            "request": request
        });

        var oAuth2Tokens = new OAuth2Tokens();
        var oAuth2TokenList = new OAuth2TokenList({model: oAuth2Tokens});

        var helperManager = new HelperManager({model: helpers});
        pm.helpers = helperManager;

        pm.request = request;
    }

    function initializeStorage() {
        var storage = new Storage();
        pm.storage = storage;
    }

    function initializeRequestMethods() {
        var requestMethods = new RequestMethods();
        pm.methods = requestMethods;
    }

    function initializeSidebar() {
        var sidebarState = new SidebarState({history: pm.history, collections: pm.collections});
        var sidebar = new Sidebar({ model: sidebarState });
    }

    function initializeDriveSync() {
        if (pm.features.isFeatureEnabled(FEATURES.DRIVE_SYNC)) {
            var driveSyncLog = new DriveSyncLog();
            var driveSyncLogger = new DriveSyncLogger({model: driveSyncLog});
            var driveSync = new DriveSync({log: driveSyncLog});
            var driveSyncIntroduction = new DriveSyncIntroduction({model: driveSync});
        }
        else {
            console.log("Drive sync is disabled");
        }
    }

    function initializeDirectory() {
        var directory = new Directory();
        var directoryBrowser = new DirectoryBrowser({model: directory});
    }

    function initializeUser() {
        var header = new Header();

        var user = new User();
        var userStatus = new UserStatus({model: user});
        var userCollections = new UserCollections({model: user});
        pm.user = user;
    }

    pm.mediator = new Mediator();

    initializeStorage();

    pm.settings = new Settings();

    pm.methods = new RequestMethods(function() {
        pm.settings.init(function() {
            var settingsModal = new SettingsModal({model: pm.settings});
            pm.filesystem.init();
            pm.indexedDB.open(function() {
                initializePostmanAPI();
                initializeRequester();
                initializeHistory();
                initializeCollections();

                initializeEnvironments();
                initializeHeaderPresets();

                initializeSidebar();

                pm.broadcasts.init();

                initializeDriveSync();
                initializeUser();
                initializeDirectory();

                initializeTCPReader();

                pm.hasPostmanInitialized = true;
            });
        });
    });
};

var GruntLiveReload = GruntLiveReload || {};
GruntLiveReload.init = function() {
  var ws = new WebSocket("ws://localhost:35729/livereload");
  ws.onopen = function() {
    console.log("LiveReload WebSocket initialized and ready.");
  };
  ws.onmessage = function(evt) {
    var wsData = JSON.parse(evt.data);
    if (wsData.command == "reload") {
      chrome.runtime.reload();
    } else {
      console.log("LiveReload Message", evt.data);
    }
  };
  ws.onerror = function(evt) {
    console.error("LiveReload WebSocket Error", evt);
  };
};

// GruntLiveReload.init();

$(document).ready(function () {
    pm.init();
});