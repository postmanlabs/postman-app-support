function changeValueAfterTime(variable, value, time) {
	setTimeout(function() {
		variable.val = value;
	}, time);
}

pm.tester = {
	setUrl: function(url) {
		$("#url").val(url);
	},

	setMethod: function(method) {
		$("#request-method-selector").val(method);
		$("#request-method-selector").trigger("change");
	},

	submitRequest: function() {
		$("#submit-request").click();
	},

	resetHistory: function() {
		pm.history.clear();
	},

	resetRequest: function() {
		$("#request-actions-reset").click();
	},

	checkStatus: function(term) {
		var content = $(".response-code .data").html();
		var found = content.search(term) >= 0;
		return found;
	},

	isResponseVisible: function() {
		var display = $("#response-as-code .CodeMirror").css("display") === "block";
		return display;
	},

	getPrettyBody: function() {
		return $("#response-as-code").html();
	},

	prettyBodyHasString: function(term) {
		var body = pm.tester.getPrettyBody();
		var found = body.search(term) >= 0;
		return found;
	},

	areHeadersVisible: function() {
		var display = $("#response-headers-container").css("display") === "block";
		return display;
	},

	getHeaderValue: function(key) {
		var kvpairs = $("#headers-keyvaleditor").keyvalueeditor("getValues");
		for(var i = 0; i < kvpairs.length; i++) {
			var pair = kvpairs[i];
			if(pair.key === key) {
				return pair.value;
			}
		}

		return false;
	},

	kvpairExistsInArray: function(params, pair) {
		for(var i = 0; i < params.length; i++) {
			if(params[i].key === pair.key) {
				if (params[i].value === pair.value) {
					return true;
				}
				else {
					return false;
				}
			}
		}

		return false;
	},

	setBodyType: function(type) {
		$("#data-mode-selector a[data-mode='" + type + "']").click();
	},

	toggleURLParams: function() {
		$("#url-keyvaleditor-actions-open").click();
	},

	getURLParamsLength: function() {
		return $("#url-keyvaleditor").keyvalueeditor("getValues").length;
	},

	setURLParams: function(urlParams) {
		$("#url-keyvaleditor").keyvalueeditor("reset", urlParams);
	},

	getURLParams: function() {
		return $("#url-keyvaleditor").keyvalueeditor("getValues");
	},

	setFormDataParams: function(params) {
		$("#formdata-keyvaleditor").keyvalueeditor("reset", params);
	},

	getFormDataParams: function() {
		return $("#formdata-keyvaleditor").keyvalueeditor("getValues");
	},

	setURLEncodedParams: function(params) {
		$("#urlencoded-keyvaleditor").keyvalueeditor("reset", params);
	},

	getURLEncodedParams: function(params) {
		return $("#urlencoded-keyvaleditor").keyvalueeditor("getValues");
	},

	setRawData: function(data) {
		var body = pm.request.get("body");
		body.loadData("raw", data, false);
	},

	setHeaders: function(headers) {
		$("#headers-keyvaleditor").keyvalueeditor("reset", headers);
	},

	toggleHeadersEditor: function() {
		$("#headers-keyvaleditor-actions-open").click();
	},

	setEnvironmentByName: function(name) {
		var environments = pm.envManager.get("environments").toJSON();
		for(var i = 0; i < environments.length; i++) {
			if (name === environments[i].name) {
				pm.settings.setSetting("selectedEnvironmentId", environments[i].id);
				pm.envManager.setCurrentEnvironment();
				break;
			}
		}
	},

	addTestEnvironments: function() {
		var environments = pm.envManager.get("environments");

		var values = [
			{key: "base_url", value: "http://localhost:5000/"},
			{key: "full_url", value: "http://localhost:5000/get"},
			{key: "resource_get", value: "/get"},
			{key: "resource_get_with_vars", value: "/get?key1=val1&key2=val2"},
			{key: "resource_post", value:  "/post"},
			{key: "v", value:  "test"},
			{key: "Foo", value:  "bar"},
			{key: "Test", value:  "This"},
			{key: "header_json", value:  "application/json"}
		];

		environments.addEnvironment("test_env_1", values);

		var values_basic_test_env = [
			{key: "username", value:  "Aladin"},
			{key: "password", value:  "sesam open"}
		];

		environments.addEnvironment("test_basic_env", values_basic_test_env);

		var values_oauth_test_env = [
			{key: "url", value: "http://photos.example.net/photos"},
			{key: "consumer_key", value:  "dpf43f3p2l4k3l03"},
			{key: "consumer_secret", value:  "kd94hf93k423kf44"},
			{key: "token", value:  "nnch734d00sl2jdk"},
			{key: "token_secret", value:  "pfkkdhi9sl3r4s00"},
			{key: "nonce", value:  "kllo9940pd9333jh"},
			{key: "timestamp", value:  "1191242096"},
			{key: "signature_method", value: "HMAC-SHA1"},
			{key: "version", value: "1.0"},
			{key: "url", value:  "http://photos.example.net/photos"},
			{key: "file", value:  "vacation.jpg"},
			{key: "size", value:  "original"}
		];

		environments.addEnvironment("test_oauth_env", values_oauth_test_env);

		var values_digest_test_env = [
			{key: "username", value:  "user"},
			{key: "realm", value:  "me@kennethreitz.com"},
			{key: "password", value:  "pass"},
			{key: "nonce", value:  "59c177ca4c8aa616a0e0007717a2225d"},
			{key: "algorithm", value:  "MD5"},
			{key: "qop", value:  "auth"},
			{key: "nonce_count", value:  "00000002"},
			{key: "client_nonce", value:  "a621deed62b2ff96"},
			{key: "opaque", value:  "c68f9b6d2ccdf56c49945e0788fd1017"}
		];

		environments.addEnvironment("test_digest_env", values_digest_test_env);
	},

	addTestGlobals: function() {
		var globals = pm.envManager.get("globals");

		var values = [
			{key: "full_global_url", value: "http://localhost:5000/get"},
			{key: "global_resource_get", value: "/get"},
			{key: "Global Foo", value:  "Global Bar"},
			{key: "Global Phew", value:  "Global Works"}
		];

		globals.saveGlobals(values);
	},

	setBasicAuthParams: function(params) {
		$("#request-helper-tabs li[data-id='basicAuth']").click();
		$("#request-helper-basicAuth-username").val(params.username);
		$("#request-helper-basicAuth-password").val(params.password);
		$("#request-helper-basicAuth .request-helper-submit").click();
	},

	setOAuth1Params: function(params) {
		$("#request-helper-tabs li[data-id='oAuth1']").click();

		$("#request-helper-oauth1-consumerKey").val(params.consumer_key);
		$("#request-helper-oauth1-consumerSecret").val(params.consumer_secret);
		$("#request-helper-oauth1-token").val(params.token);
		$("#request-helper-oauth1-tokenSecret").val(params.token_secret);
		$("#request-helper-oauth1-signatureMethod").val(params.signature_method);
		$("#request-helper-oauth1-timestamp").val(params.timestamp);
		$("#request-helper-oauth1-nonce").val(params.nonce);
		$("#request-helper-oauth1-version").val(params.version);
		$("#request-helper-oauth1-realm").val(params.realm);

		$("#request-helper-oauth1-header").prop("checked", params.header);
		$("#request-helper-oauth1-auto").prop("checked", params.auto);

		$("#request-helper-oAuth1 .request-helper-submit").click();
	},

	setDigestAuthParams: function(params) {
		$("#request-helper-tabs li[data-id='digestAuth']").click();
		$("#request-helper-digestAuth-username").val(params.username);
		$("#request-helper-digestAuth-realm").val(params.realm);
		$("#request-helper-digestAuth-password").val(params.password);
		$("#request-helper-digestAuth-nonce").val(params.nonce);
		$("#request-helper-digestAuth-algorithm").val(params.algorithm);
		$("#request-helper-digestAuth-qop").val(params.qop);
		$("#request-helper-digestAuth-nonceCount").val(params.nonce_count);
		$("#request-helper-digestAuth-clientNonce").val(params.client_nonce);
		$("#request-helper-digestAuth-opaque").val(params.opaque);
		$("#request-helper-digestAuth .request-helper-submit").click();
	},

	historyHasString: function(string) {
		var content = $("#history-items").html();
		var found = content.search(string) >= 0;
		return found;
	},

	selectHistoryItem: function(index) {
		$("#history-items li:nth-child(" + index + ") .request").click();
	},

	deleteHistoryItem: function(index) {
		$("#history-items li:nth-child(" + index + ") .request-actions-delete").click();
	},

	urlHasString: function(string) {
		var content = $("#url").val();
		var found = content.search(string) >= 0;
		return found;
	},

	bodyTypeIs: function(type) {
		var classes = $("#data-mode-selector a[data-mode='" + type + "']").attr("class");
		return classes.search("active") >= 0;
	},

	methodIs: function(method) {
		return $("#request-method-selector").val() === method;
	},

	selectSidebarTab: function(tab) {
		$("#sidebar-selectors-" + tab).click();
	},

	collectionSidebarHasString: function(string) {
		var content = $("#collection-items").html();
		var found = content.search(string) >= 0;
		return found;
	},

	openNewCollectionModal: function() {
		$("#collections-options a:nth-child(1)").click();
	},

	setNewCollectionModalName: function(name) {
		$("#new-collection-blank").val(name);
	},

	submitNewCollectionModal: function() {
		$("#modal-new-collection .btn-primary").click();
	},

	cancelNewCollectionModal: function() {
		$("#modal-new-collection .btn-secondary").click();
	},

	openAddRequestToCollectionModal: function() {
		$("#add-to-collection").click();
	},

	addDataToAddRequestToCollectionModal: function(params) {
		if (params.existingCollectionName) {
			var options = $("#select-collection option");
			var id;
			for(var i = 0; i < options.length; i++) {
				var name = $(options[i]).html();
				if(name === params.existingCollectionName) {
					id = $(options[i]).attr("value");
					break;
				}
			}

			$("#select-collection").val(id);
		}

		if (params.newCollectionName) {
			$("#new-collection").val(params.newCollectionName);
		}

		if (params.requestName) {
			$("#new-request-name").val(params.requestName);
		}

		if (params.requestDescription) {
			if(pm.addRequestToCollectionEditor) {
				pm.addRequestToCollectionEditor.setValue(params.requestDescription);
			}
			else {
				$("#new-request-description").val(params.requestDescription);
			}
		}
	},

	submitAddRequestToCollectionModal: function() {
		$("#modal-add-to-collection .btn-primary").click();
	},

	activeSidebarTab: function() {
		return $("#sidebar-selectors .active").attr("data-id");
	},

	saveButtonIsVisible: function() {
		return $("#update-request-in-collection").css("display") !== "none";
	},

	requestMetaSectionVisibility: function() {
		return $("#request-meta").css("display");
	},

	requestMetaNameHas: function(term) {
		var content = $("#request-name").html();
		var found = content.search(term) >= 0;
		return found;
	},

	requestMetaDescriptionHas: function(term) {
		var content = $("#request-description").html();
		var found = content.search(term) >= 0;
		return found;
	},

	collectionListIsOpen: function(index) {
		return $($("#collection-items .sidebar-collection-requests")[index - 1]).css("display") === "block";
	},

	openDeleteCollectionModalForIndex: function(index) {
		$($("#collection-items .collection-actions-delete")[index - 1]).click();
	},

	submitDeleteCollectionModal: function() {
		$("#modal-delete-collection .btn-danger").click();
	},

	openEditCollectionModal: function(index) {
		$($("#collection-items .collection-actions-edit")[index - 1]).click();
	},

	setEditCollectionModalName: function(name) {
		$("#modal-edit-collection .collection-name").val(name);
	},

	submitEditCollectionModal: function() {
		$("#modal-edit-collection .btn-primary").click();
	},

	openEditCollectionRequestModal: function(collectionIndex, requestIndex) {
		var itemId = $($($("#collection-items .sidebar-collection-requests")[collectionIndex - 1]).children()[requestIndex - 1]).attr("id");
		$("#" + itemId + " .request-actions-edit").click();
	},

	addDataToEditRequestCollectionModal: function(params) {
		if(params.requestName) {
			$("#modal-edit-collection-request .collection-request-name").val(params.requestName);
		}

		if(params.requestDescription) {
			pm.editCollectionRequestEditor.setValue(params.requestDescription);
		}
	},

	submitEditCollectionRequestModal: function() {
		$("#modal-edit-collection-request .btn-primary").click();
	},

	openDeleteCollectionRequestModalForIndex: function(collectionIndex, requestIndex) {
		var itemId = $($($("#collection-items .sidebar-collection-requests")[collectionIndex - 1]).children()[requestIndex - 1]).attr("id");
		$("#" + itemId + " .request-actions-delete").click();
	},

	submitDeleteCollectionRequestModal: function() {
		$("#modal-delete-collection-request .btn-danger").click();
	},

	selectCollectionRequest: function(collectionIndex, requestIndex) {
		var itemId = $($($("#collection-items .sidebar-collection-requests")[collectionIndex - 1]).children()[requestIndex - 1]).attr("id");
		$("#" + itemId + " .request-actions-load").click();
	},

	/*Folders*/

	openAddFolderModal: function(collectionIndex) {
		$($("#collection-items .collection-actions-add-folder")[collectionIndex - 1]).click();
	},

	setNewFolderName: function(name) {
		$("#add-folder-name").val(name);
	},

	submitNewFolderModal: function() {
		$("#modal-add-folder .btn-primary").click();
	},

	collectionHasFolderName: function(collectionIndex, name) {
		var folders = $($("#collection-items .sidebar-collection .folders")[collectionIndex - 1]).find(".folder-head-name");
		var found = false;

		for(var i = 0; i < folders.length; i++) {
			found = $(folders[i]).html().search(name) >= 0;
			if (found) break;
		}

		return found;
	},

	openEditFolderModal: function(collectionIndex, folderIndex) {
		var itemId = $($($("#collection-items .folders")[collectionIndex - 1]).children()[folderIndex - 1]).attr("id");
		$("#" + itemId + " .folder-actions-edit").click();
	},

	setEditFolderName: function(name) {
		$("#edit-folder-name").val(name);
	},

	submitEditFolderModal: function() {
		$("#modal-edit-folder .btn-primary").click();
	},

	openDeleteFolderModal: function(collectionIndex, folderIndex) {
		var itemId = $($($("#collection-items .folders")[collectionIndex - 1]).children()[folderIndex - 1]).attr("id");
		$("#" + itemId + " .folder-actions-delete").click();
	},

	submitDeleteFolderModal: function() {
		$("#modal-delete-folder .btn-danger").click();
	},

	collectionHasRequest: function(collectionIndex, name) {
		collectionIndex += 1;

		var selector = "#collection-items .sidebar-collection:nth-child(" + collectionIndex + ") .sidebar-collection-requests";
		var requestsHtml = $(selector).html()
		return requestsHtml.search(name) >= 0;
	},

	collectionFolderHasRequest: function(collectionIndex, folderIndex, name) {
		var requestsHtml = $($($("#collection-items .sidebar-collection .folders")[collectionIndex - 1]).find(".folder-requests")[folderIndex - 1]).html()
		return requestsHtml.search(name) >= 0;
	},

	getIDOfRequestInFolder: function(collectionIndex, folderIndex, requestIndex) {
		//DOM has one extra element
		collectionIndex += 1;

		var selector = "#collection-items .sidebar-collection:nth-child(" + collectionIndex + ") ";
		selector += ".folders .folder:nth-child(" + folderIndex + ") ";
		selector += ".sidebar-request:nth-child(" + requestIndex + ") ";
		selector += " .request";

		return $(selector).attr("data-id");
	},

	getIDOfRequestInCollection: function(collectionIndex, requestIndex) {
		collectionIndex += 1;

		var selector = "#collection-items .sidebar-collection:nth-child(" + collectionIndex + ") .sidebar-collection-requests ";
		selector += ".sidebar-collection-request:nth-child(" + requestIndex + ") ";
		selector += " .request";

		return $(selector).attr("data-id");
	},

	getIDOfFolderInCollection: function(collectionIndex, folderIndex) {
		collectionIndex += 1;

		var selector = "#collection-items .sidebar-collection:nth-child(" + collectionIndex + ") ";
		selector += ".folders .folder:nth-child(" + folderIndex + ")";

		return $(selector).attr("data-id");
	},

	getIDOfCollection: function(collectionIndex) {
		collectionIndex += 1;

		var selector = "#collection-items .sidebar-collection:nth-child(" + collectionIndex + ") ";
		return $(selector).attr("data-id");
	},

	clickOnSaveSampleResponseButton: function() {
		$("#response-sample-save-start").click();
	},

	setSampleResponseName: function(name) {
		$("#response-sample-name").val(name);
	},

	saveSampleResponse: function() {
		$("#response-sample-save").click();
	},

	sampleResponseListHas: function(term) {
		var h = $("#request-samples-list").html()
		return h.search(term) >= 0;
	},

	loadSampleResponse: function(index) {
		$("#request-samples-list .sample-response-actions-load:nth-child(" + index + ")").click()
	},

	deleteSampleResponse: function(index) {
		$("#request-samples-list .sample-response-actions-delete:nth-child(" + index + ")").click()
	},

	setPathVariables: function(params) {
		var rows = [];
		var row;

		for (var key in params) {
		    if (params.hasOwnProperty(key)) {
		        row = {
		            "key": key,
		            "value": params[key]
		        }

		        rows.push(row);
		    }
		}

		$("#pathvariables-keyvaleditor").keyvalueeditor("reset", rows);
	}
};