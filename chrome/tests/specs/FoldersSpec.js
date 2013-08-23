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
				}, codeMirrorModalWaitTime);
			});

			waitsFor(function() {
				return isOpen === true;
			}, "Could not open new collection modal", codeMirrorWaitTime);

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
				}, codeMirrorModalWaitTime);
			});

			waitsFor(function() {
				return isAddFolderOpen === true;
			}, "could not open new folder", codeMirrorWaitTime);

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
			var isDataAdded = false;

			runs(function() {
				var collection = mockCollections["noRequests"];
				pm.collections.addAsNewCollection(collection, false);
				setTimeout(function() {
					isDataAdded = true;
				}, 100);
			});

			waitsFor(function() {
				return isDataAdded === true;
			}, "Could not add data", waitTime);

			runs(function() {
				expect(pm.tester.collectionHasFolderName(1, "Half Life")).toBe(true);
				expect(pm.tester.collectionHasFolderName(1, "Fear")).toBe(true);
				expect(pm.tester.collectionHasFolderName(1, "Serious Sam")).toBe(true);
			});
		});

		it("load collection with folders and requests", function() {
			var isDataAdded = false;

			runs(function() {
				var collection = mockCollections["withFoldersAndRequests"];
				pm.collections.addAsNewCollection(collection);
				setTimeout(function() {
					isDataAdded = true;
				}, 200);
			});

			waitsFor(function() {
				return isDataAdded === true;
			}, "Could not add data", waitTime);

			runs(function() {
				expect(pm.tester.collectionHasFolderName(2, "POST")).toBe(true);
				expect(pm.tester.collectionHasFolderName(2, "Others")).toBe(true);

				expect(pm.tester.collectionFolderHasRequest(2, 1, "Delete")).toBe(true);
				expect(pm.tester.collectionFolderHasRequest(2, 2, "POST - application")).toBe(true);

				expect(pm.tester.collectionSidebarHasString("GET request with params")).toBe(true);
			});
		});
	});

	describe("can move requests between folders and collections", function() {
		it("can move requests between folders of the same collection", function() {
			var isMoved = false;

			runs(function() {
				var targetCollection = mockCollections["withFoldersAndRequests"];
				//Others folder/Delete to POST folder
				var requestId = pm.tester.getIDOfRequestInFolder(2, 1, 1);
				var folderId = pm.tester.getIDOfFolderInCollection(2, 2);

				pm.collections.moveRequestToFolder(requestId, folderId);

				setTimeout(function() {
					isMoved = true;
				}, 200);
			});

			waitsFor(function() {
				return isMoved === true;
			}, "could not execute move function", waitTime);

			runs(function() {
				expect(pm.tester.collectionFolderHasRequest(2, 1, "Delete")).toBe(false);
				expect(pm.tester.collectionFolderHasRequest(2, 2, "Delete")).toBe(true);
			});
		});

		it("can move requests from folder to parent collection", function() {
			var isMoved = false;

			runs(function() {
				var targetCollection = mockCollections["withFoldersAndRequests"];
				//Others folder/Delete to POST folder
				var requestId = pm.tester.getIDOfRequestInFolder(2, 2, 1);
				var collectionId = pm.tester.getIDOfCollection(2);

				pm.collections.moveRequestToCollection(requestId, collectionId);

				setTimeout(function() {
					isMoved = true;
				}, 200);
			});

			waitsFor(function() {
				return isMoved === true;
			}, "could not execute move function", waitTime);

			runs(function() {
				expect(pm.tester.collectionFolderHasRequest(2, 2, "application/xml")).toBe(false);
				expect(pm.tester.collectionHasRequest(2, "application/xml")).toBe(true);
			});
		});

		it("can move requests from parent collection to folder", function() {
			var isMoved = false;

			runs(function() {
				var targetCollection = mockCollections["withFoldersAndRequests"];
				//Others folder/Delete to POST folder
				var requestId = pm.tester.getIDOfRequestInCollection(2, 1);
				var folderId = pm.tester.getIDOfFolderInCollection(2, 2);

				pm.collections.moveRequestToFolder(requestId, folderId);

				setTimeout(function() {
					isMoved = true;
				}, 200);
			});

			waitsFor(function() {
				return isMoved === true;
			}, "could not execute move function", waitTime);

			runs(function() {
				expect(pm.tester.collectionHasRequest(2, "GET request with params")).toBe(false);
				expect(pm.tester.collectionFolderHasRequest(2, 2, "GET request with params")).toBe(true);
			});
		});

		it("can move requests between folders of different collection", function() {
			var isMoved = false;

			runs(function() {
				var targetCollection = mockCollections["withFoldersAndRequests"];
				//Others folder/Delete to POST folder
				var requestId = pm.tester.getIDOfRequestInFolder(2, 1, 1);
				var folderId = pm.tester.getIDOfFolderInCollection(1, 2);

				pm.collections.moveRequestToFolder(requestId, folderId);

				setTimeout(function() {
					isMoved = true;
				}, 200);
			});

			waitsFor(function() {
				return isMoved === true;
			}, "could not execute move function", waitTime);

			runs(function() {
				expect(pm.tester.collectionFolderHasRequest(2, 1, "GET")).toBe(false);
				expect(pm.tester.collectionFolderHasRequest(1, 2, "GET")).toBe(true);
			});
		});

		it("can move requests from folder of one collection to another collection", function() {
			var isMoved = false;

			runs(function() {
				var targetCollection = mockCollections["withFoldersAndRequests"];
				//Others folder/Delete to POST folder
				var requestId = pm.tester.getIDOfRequestInFolder(2, 2, 1);
				var collectionId = pm.tester.getIDOfCollection(1);

				pm.collections.moveRequestToCollection(requestId, collectionId);

				setTimeout(function() {
					isMoved = true;
				}, 200);
			});

			waitsFor(function() {
				return isMoved === true;
			}, "could not execute move function", waitTime);

			runs(function() {
				expect(pm.tester.collectionFolderHasRequest(2, 2, "Post FormData")).toBe(false);
				expect(pm.tester.collectionHasRequest(1, "Post FormData")).toBe(true);
			});
		});

		it("can move requests from collection to folder of different collection", function() {
			var isMoved = false;

			runs(function() {
				var targetCollection = mockCollections["withFoldersAndRequests"];
				//Others folder/Delete to POST folder
				var requestId = pm.tester.getIDOfRequestInCollection(2, 1);
				var collectionId = pm.tester.getIDOfCollection(1);

				pm.collections.moveRequestToCollection(requestId, collectionId);

				setTimeout(function() {
					isMoved = true;
				}, 200);
			});

			waitsFor(function() {
				return isMoved === true;
			}, "could not execute move function", waitTime);

			runs(function() {
				expect(pm.tester.collectionHasRequest(2, "application/xml")).toBe(false);
				expect(pm.tester.collectionHasRequest(1, "application/xml")).toBe(true);
			});
		});
	});

	describe("add requests to folders", function() {
		it("can add a request from add request dialog", function() {

		});
	});

	xdescribe("can search for requests within folders", function() {

	});


	describe("can clear all collections", function() {
		it("cleared collections", function() {
			var areRemoved = false;

			runs(function() {
				pm.collections.deleteCollection(pm.tester.getIDOfCollection(1));
				pm.collections.deleteCollection(pm.tester.getIDOfCollection(2));
				pm.collections.deleteCollection(pm.tester.getIDOfCollection(3));

				setTimeout(function() {
					areRemoved = true;
				}, 100);
			});

			waitsFor(function() {
				return areRemoved === false;
			}, "could not remove all collections", waitTime)
		});
	});
});