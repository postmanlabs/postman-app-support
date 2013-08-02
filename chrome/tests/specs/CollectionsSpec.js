describe("Collections", function() {
	var modalWaitTime = 500;
	var codeMirrorModalWaitTime = 2000;
	var waitTime = modalWaitTime + 50;
	var codeMirrorWaitTime = codeMirrorModalWaitTime + 50;

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
		it("can add a GET request to new collection", function() {			
			var isOpen = false;
			var isSubmitted = false;

			runs(function() {
				pm.tester.setUrl("http://localhost:5000/get");
				pm.tester.setMethod("GET");	

				var params = {
					"newCollectionName": "Doom 3",
					"requestName": "GET me some monsters",
					"requestDescription": "I need some monsters!"
				};

				pm.tester.addDataToAddRequestToCollectionModal(params);	

				pm.tester.openAddRequestToCollectionModal();

				setTimeout(function() {
					isOpen = true;
				}, codeMirrorModalWaitTime);
			});
			
			waitsFor(function() {
				return isOpen === true;
			}, "Could not open add collection modal", codeMirrorWaitTime);

			runs(function() {				
				pm.tester.submitAddRequestToCollectionModal();			

				setTimeout(function() {
					isSubmitted = true;
				}, modalWaitTime);
			});

			waitsFor(function() {
				return isSubmitted === true;
			}, "Could not submit modal", codeMirrorWaitTime);

			runs(function() {
				expect(pm.tester.activeSidebarTab()).toBe("collections");
				expect(pm.tester.collectionSidebarHasString("Doom 3")).toBe(true);
				expect(pm.tester.collectionSidebarHasString("GET me some")).toBe(true);				
				expect(pm.tester.requestMetaSectionVisibility()).toBe("block");
				expect(pm.tester.requestMetaNameHas("GET me some monsters")).toBe(true);
				expect(pm.tester.requestMetaDescriptionHas("I need some monsters")).toBe(true);
				expect(pm.tester.saveButtonIsVisible()).toBe(true);
				expect(pm.tester.collectionListIsOpen(1)).toBe(true);
			});

		});
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