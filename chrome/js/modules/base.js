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
    function initializeCollections() {
        var pmCollections = new PmCollections();

        var addCollectionModal = new AddCollectionModal({model: pmCollections});
        var editCollectionModal = new EditCollectionModal({model: pmCollections});
        var deleteCollectionModal = new DeleteCollectionModal({model: pmCollections});
        var importCollectionModal = new ImportCollectionModal({model: pmCollections});
        var shareCollectionModal = new ShareCollectionModal({model: pmCollections});
        var overwriteCollectionModal = new OverwriteCollectionModal({model: pmCollections});

        var addCollectionRequestModal = new AddCollectionRequestModal({model: pmCollections});
        var editCollectionRequestModal = new EditCollectionRequestModal({model: pmCollections});
        var deleteCollectionRequestModal = new DeleteCollectionRequestModal({model: pmCollections});

        var collectionRequestDetailsView = new CollectionRequestDetailsView({model: pmCollections});

        var collectionSidebar = new CollectionSidebar({model: pmCollections});

        pm.collections = pmCollections;
    }

    function initializeHistory() {
        var history = new History();
        var historySidebar = new HistorySidebar({model: history});
        pm.history = history;
        pm.historySidebar = historySidebar;
    }

    function initializeHelpers() {
        var basicAuthProcessor = new BasicAuthProcessor();
        var digestAuthProcessor = new DigestAuthProcessor();
        var oAuth1Processor = new OAuth1Processor();

        var basicAuthForm = new BasicAuthForm({model: basicAuthProcessor});
        var digestAuthForm = new DigestAuthForm({model: digestAuthProcessor});
        var oAuth1Form = new OAuth1Form({model: oAuth1Processor});

        var helpers = new Helpers({
            "basicAuth": basicAuthProcessor,
            "digestAuth": digestAuthProcessor,
            "oAuth1": oAuth1Processor
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
    }

    function initializeHeaderPresets() {
        pm.headerPresets = new HeaderPresets();
        pm.headerPresets.init();

        var headerPresetsModal = new HeaderPresetsModal({model: pm.headerPresets});
        var headerPresetsRequestEditor = new HeaderPresetsRequestEditor({model: pm.headerPresets});
    }

    function initializeRequester() {
        var request = new Request();
        var requestEditor = new RequestEditor({model: request});
        var responseViewer = new ResponseViewer({model: request});
        pm.request = request;
    }


    Handlebars.partials = Handlebars.templates;
    var storage = new Storage();
    pm.storage = storage;

    pm.settings = new Settings();

    pm.settings.init(function() {
        var settingsModal = new SettingsModal({model: pm.settings});

        pm.indexedDB.open(function() {
            initializeHelpers();

            initializeRequester();

            initializeHistory();
            initializeCollections();

            pm.search.init();
            pm.layout.init();
            pm.editor.init();

            pm.keymap.init();
            pm.filesystem.init();

            initializeEnvironments();
            initializeHeaderPresets();

            var activeSidebarSection = pm.settings.getSetting("activeSidebarSection");

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