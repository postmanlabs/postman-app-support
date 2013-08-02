describe("Collections", function() {
	var modalWaitTime = 500;
	var waitTime = modalWaitTime + 50;

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
		pm.tester.resetRequest();
	});

	it("has initialized Postman", function() {		
		expect(pm.hasPostmanInitialized).toBe(true);		
	});  

	it("switch to collections tab", function() {
		pm.tester.selectSidebarTab("collections");
		expect(pm.tester.collectionSidebarHasString("Collections let you group")).toBe(true);
	});

	describe("new collection", function() {
		it("can add new collection", function() {
			var isOpen = false;
			var foundCollection = false;
			runs(function() {
				pm.tester.openNewCollectionModal();
				setTimeout(function() {
					isOpen = true;
				}, modalWaitTime);
			});

			waitsFor(function() {
				return isOpen === true;
			}, "Could not open new collection modal", waitTime);

			runs(function() {
				pm.tester.setNewCollectionModalName("Test new collection");
				pm.tester.submitNewCollectionModal();
				setTimeout(function() {
					foundCollection = pm.tester.collectionSidebarHasString("Test new collection");
				}, modalWaitTime);
			});

			waitsFor(function() {
				return foundCollection === true;
			}, "Could not add new collection", waitTime);			
		});

		it("can cancel new collection modal", function() {
			var isOpen = false;
			var foundCollection;
			runs(function() {
				pm.tester.openNewCollectionModal();
				setTimeout(function() {
					isOpen = true;
				}, modalWaitTime);
			});

			waitsFor(function() {
				return isOpen === true;
			}, "Could not open new collection modal", waitTime);

			runs(function() {
				pm.tester.setNewCollectionModalName("Not needed");
				pm.tester.cancelNewCollectionModal();
				setTimeout(function() {
					foundCollection = pm.tester.collectionSidebarHasString("Not needed");
				}, modalWaitTime);
			});

			waitsFor(function() {
				return foundCollection === false;
			}, "Could not add new collection", waitTime);
		});
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