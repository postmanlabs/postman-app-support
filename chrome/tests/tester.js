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
	}
};