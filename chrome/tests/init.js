describe("Postman base.js", function() {
	var clearedData = false;

	beforeEach(function() {				

		waitsFor(function() {
			return pm.hasPostmanInitialized === true;
		}, "hasPostmanInitialized", 500);

		runs(function() {
			pm.indexedDB.clearAllObjectStores(function() {
				clearedData = true;
				console.log("Cleared all object data");
			});
		}, "clear all data from indexedDB and settings");

		waitsFor(function() {
			return clearedData === true;
		}, "has cleared all data", 500);

		runs(function() {
			pm.settings.resetSettings();
		}, "reset settings");

	});

	it("has initialized Postman", function() {		
		expect(pm.hasPostmanInitialized).toBe(true);
		expect(clearedData).toBe(true);
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