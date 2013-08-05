describe("Folders", function() {
	var modalToggleWaitTime = 500;
	var codeMirrorModalWaitTime = 2000;
	var waitTime = modalToggleWaitTime + 50;
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

	describe("basic Folder actions", function() {
		it("can add a collection and a folder", function() {
			var isOpen = false;
			var foundCollection = false;

			var isAddFolderOpen = false;
			var foundFolder = false;
			var isAddFolderClosed = false;			

			runs(function() {
				pm.tester.openNewCollectionModal();
				setTimeout(function() {
					isOpen = true;
				}, modalToggleWaitTime);
			});

			waitsFor(function() {
				return isOpen === true;
			}, "Could not open new collection modal", waitTime);

			runs(function() {
				pm.tester.setNewCollectionModalName("id Software");
				pm.tester.submitNewCollectionModal();
				setTimeout(function() {
					foundCollection = pm.tester.collectionSidebarHasString("id Software");
				}, modalToggleWaitTime);
			});

			waitsFor(function() {
				return foundCollection === true;
			}, "Could not add new collection", waitTime);

			runs(function() {
				pm.tester.openAddFolderModal(1);
				setTimeout(function() {
					isAddFolderOpen = true;
				}, modalToggleWaitTime);
			});

			waitsFor(function() {
				return isAddFolderOpen === true;
			}, "could not open new folder", waitTime);

			runs(function() {
				pm.tester.setNewFolderName("Doom 3");
				pm.tester.submitNewFolderModal();

				setTimeout(function() {
					isAddFolderClosed = true;
				}, modalToggleWaitTime);
			});

			waitsFor(function() {
				return isAddFolderClosed === true;
			});

			runs(function() {
				expect(pm.tester.collectionHasFolderName(1, "Doom 3")).toBe(true);
			});
		});

		it("can add another folder", function() {
			var isAddFolderOpen = false;			
			var isAddFolderClosed = false;

			runs(function() {
				pm.tester.openAddFolderModal(1);
				setTimeout(function() {
					isAddFolderOpen = true;
				}, modalToggleWaitTime);
			});

			waitsFor(function() {
				return isAddFolderOpen === true;
			}, "could not open new folder", waitTime);

			runs(function() {
				pm.tester.setNewFolderName("Wolfenstein");
				pm.tester.submitNewFolderModal();

				setTimeout(function() {
					isAddFolderClosed = true;
				}, modalToggleWaitTime);
			});

			waitsFor(function() {
				return isAddFolderClosed === true;
			}, "could not close add folder", waitTime);

			runs(function() {
				expect(pm.tester.collectionHasFolderName(1, "Wolfenstein")).toBe(true);
			});	

		});

		it("can change folder name", function() {
			var isEditFolderOpen = false;
			var isEditFolderClosed = false;

			runs(function() {
				pm.tester.openEditFolderModal(1, 1);
				setTimeout(function() {
					isEditFolderOpen = true;
				}, modalToggleWaitTime);
			});

			waitsFor(function() {
				return isEditFolderOpen === true;
			}, "could not open edit folder modal", waitTime);

			runs(function() {
				pm.tester.setEditFolderName("Commander Keen");
				pm.tester.submitEditFolderModal();

				setTimeout(function() {
					isEditFolderClosed = true;
				}, modalToggleWaitTime);
			});

			waitsFor(function() {
				return isEditFolderClosed === true;
			}, "could not close edit folder modal", waitTime);

			runs(function() {
				expect(pm.tester.collectionHasFolderName(1, "Commander Keen")).toBe(true);
			});
		});

		it("can delete folder", function() {
			var isDeleteFolderOpen = false;
			var isDeleteFolderClosed = false;

			runs(function() {
				pm.tester.openDeleteFolderModal(1, 1);
				setTimeout(function() {
					isDeleteFolderOpen = true;
				}, modalToggleWaitTime);
			});

			waitsFor(function() {
				return isDeleteFolderOpen === true;
			}, "could not open edit folder modal", waitTime);

			runs(function() {
				pm.tester.submitDeleteFolderModal();

				setTimeout(function() {
					isDeleteFolderClosed = true;
				}, modalToggleWaitTime);
			});

			waitsFor(function() {
				return isDeleteFolderClosed === true;
			}, "could not close edit folder modal", waitTime);

			runs(function() {
				expect(pm.tester.collectionHasFolderName(1, "Commander Keen")).toBe(false);
			});
		});				
	});

	describe("render imported collection properly", function() {
		it("load collection without any request", function() {

		});

		it("load collection with requests", function() {

		});

		it("load collection with only folders", function() {

		});

		it("load collection with folders and requests", function() {

		});
	});

	describe("can move requests between folders and collections", function() {
		it("can move requests between folders of the same collection", function() {

		});

		it("can move requests from folder to parent collection", function() {

		});

		it("can move requests from parent collection to folder", function() {

		});

		it("can move requests between folders of different collection", function() {

		});

		it("can move requests from folder of one collection to another collection", function() {

		});

		it("can move requests from collection to folder of different collection", function() {

		});
	});

	describe("add requests to folders", function() {
		it("can add a request from add request dialog", function() {

		});		
	});

});