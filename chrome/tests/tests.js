describe("Postman Loaded", function() {
	it("has indexedDB initialized", function() {
		console.log($("#sidebar-section-history .empty-message").html());
	});
});

(function() {
	var jasmineEnv = jasmine.getEnv();
	jasmineEnv.updateInterval = 1000;

	var htmlReporter = new jasmine.HtmlReporter();

	jasmineEnv.addReporter(htmlReporter);

	jasmineEnv.specFilter = function(spec) {
		return htmlReporter.specFilter(spec);
	};

	var currentWindowOnload = window.onload;

	window.onload = function() {
		if (currentWindowOnload) {
			currentWindowOnload();
		}
		execJasmine();
	};

	function execJasmine() {
		jasmineEnv.execute();
	}

})();