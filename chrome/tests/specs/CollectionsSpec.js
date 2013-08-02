xdescribe("Collections", function() {
	var waitTime = 100;

	beforeEach(function() {
		waitsFor(function() {
			return pm.hasPostmanInitialized === true;
		}, "hasPostmanInitialized", 500);

		runs(function() {
			pm.settings.resetSettings();
			pm.tester.resetRequest();
		});		
	});

	afterEach(function() {
		// pm.tester.resetRequest();
	});

	it("has initialized Postman", function() {		
		expect(pm.hasPostmanInitialized).toBe(true);		
	});  

	it("switch to collections tab", function() {

	});

	describe("new collection", function() {

	});

	describe("add request to collection", function() {

	});

	describe("delete collection modal", function() {

	});	

	describe("edit collection", function() {

	});

	describe("edit collection request", function() {

	});

	describe("import collection", function() {
		it("can overwrite collections", function() {

		});

		it("can add a duplicate collection", function() {

		});

		it("can merge two collections with the same collection id", function() {

		});
	});

	describe("share a collection", function() {
		//TODO Use a spy here and ensure that the collection was called
	});

	describe("search within collections", function() {

	});
});