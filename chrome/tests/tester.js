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

	resetRequest: function() {
		$("#request-actions-reset").click();
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

	setFormDataParams: function(params) {
		$("#formdata-keyvaleditor").keyvalueeditor("reset", params);
	},

	setURLEncodedParams: function(params) {
		$("#urlencoded-keyvaleditor").keyvalueeditor("reset", params);
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
		console.log(pm, pm.envManager);

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
			{key: "consumer_key", value:  "dpf43f3p2l4k3l03"},
			{key: "consumer_secret", value:  "kd94hf93k423kf44"},
			{key: "token", value:  "nnch734d00sl2jdk"},
			{key: "token_secret", value:  "pfkkdhi9sl3r4s00"},
			{key: "nonce", value:  "kllo9940pd9333jh"},
			{key: "timestamp", value:  "1191242096"},
			{key: "url", value:  "http://photos.example.net/photos"},
			{key: "file", value:  "vacation.jpg"},
			{key: "size", value:  "original"}
		];

		environments.addEnvironment("test_oauth_env", values_oauth_test_env);

		var values_digest_test_env = [
			{key: "user", value:  "user"},
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
	}
};