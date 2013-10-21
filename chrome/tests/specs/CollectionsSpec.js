describe("Collections", function() {
	var modalWaitTime = 500;
	var codeMirrorModalWaitTime = 2000;
	var waitTime = modalWaitTime + 50;
	var codeMirrorWaitTime = codeMirrorModalWaitTime + 50;

	// TODO Delete all collections after this has run
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
		$(".modal-backdrop").css("display", "none");
		$(".modal-scrollable").css("display", "none");
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
				}, codeMirrorModalWaitTime);
			});

			waitsFor(function() {
				return isOpen === true;
			}, "Could not open new collection modal", codeMirrorWaitTime);

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

		it("can delete a collection", function() {
			var isOpen = false;
			var isSubmitted = false;

			runs(function() {
				// Open delete collection modal for first index
				pm.tester.openDeleteCollectionModalForIndex(1);
				setTimeout(function() {
					isOpen = true;
				}, modalWaitTime);
			});

			waitsFor(function() {
				return isOpen === true;
			}, "could not open modal", modalWaitTime);

			runs(function() {
				pm.tester.submitDeleteCollectionModal();
				setTimeout(function() {
					isSubmitted = true;
				}, modalWaitTime);
			});

			waitsFor(function() {
				return isSubmitted === true;
			}, "could not submit", modalWaitTime);

			runs(function() {
				//Check if the collection is gone
				expect(pm.tester.collectionSidebarHasString("Test new collection")).toBe(false);
			});
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

	describe("edit collection", function() {
		it("can add and edit a collection", function() {
			var isOpen = false;
			var isSubmitted = false;
			var foundCollection = false;

			var isSecondModalOpen = false;
			var isSecondModalSubmitted = false;

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
				pm.tester.setNewCollectionModalName("A collection to be edited");
				pm.tester.submitNewCollectionModal();
				setTimeout(function() {
					foundCollection = pm.tester.collectionSidebarHasString("A collection to be edited");
				}, modalWaitTime);
			});

			waitsFor(function() {
				return foundCollection === true;
			}, "Could not add new collection", waitTime);

			runs(function() {
				expect(foundCollection).toBe(true);

				pm.tester.openEditCollectionModal(1);

				setTimeout(function() {
					isSecondModalOpen = true;
				}, modalWaitTime);
			});

			waitsFor(function() {
				return isSecondModalOpen === true;
			}, "could not open modal", modalWaitTime);

			runs(function() {
				pm.tester.setEditCollectionModalName("Edited collection");
				pm.tester.submitEditCollectionModal();
				setTimeout(function() {
					isSecondModalSubmitted = true;
				}, modalWaitTime);
			});

			waitsFor(function() {
				return isSecondModalSubmitted === true;
			}, "could not submit", modalWaitTime);

			runs(function() {
				//Check if the collection is gone
				expect(pm.tester.collectionSidebarHasString("Edited collection")).toBe(true);
			});
		});

		it("can add a POST request to an existing collection", function() {
			var isOpen = false;
			var isSubmitted = false;

			runs(function() {
				pm.tester.setUrl("http://localhost:5000/post");
				pm.tester.setMethod("POST");

				var params = {
					"existingCollectionName": "Edited collection",
					"requestName": "POST some bullets",
					"requestDescription": "Blast those monsters!"
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
				expect(pm.tester.methodIs("POST")).toBe(true);
				expect(pm.tester.collectionSidebarHasString("Edited collection")).toBe(true);
				expect(pm.tester.collectionSidebarHasString("POST some bullets")).toBe(true);
				expect(pm.tester.requestMetaSectionVisibility()).toBe("block");
				expect(pm.tester.requestMetaNameHas("POST some bullets")).toBe(true);
				expect(pm.tester.requestMetaDescriptionHas("Blast those monsters")).toBe(true);
				expect(pm.tester.saveButtonIsVisible()).toBe(true);
				expect(pm.tester.collectionListIsOpen(1)).toBe(true);
			});
		});

		describe("edit collection request", function() {
			var isOpen = false;
			var isSubmitted = false;

			var isSecondModalOpen = false;
			var isSecondModalSubmitted = false;

			runs(function() {
				pm.tester.setUrl("http://localhost:5000/post");
				pm.tester.setMethod("POST");

				var params = {
					"existingCollectionName": "Edited collection",
					"requestName": "DELETE some stuff",
					"requestDescription": "Delete delete delete!"
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
				expect(pm.tester.methodIs("POST")).toBe(true);
				expect(pm.tester.collectionSidebarHasString("DELETE some stuff")).toBe(true);
				expect(pm.tester.requestMetaSectionVisibility()).toBe("block");
				expect(pm.tester.requestMetaNameHas("DELETE some stuff")).toBe(true);
				expect(pm.tester.requestMetaDescriptionHas("Delete delete delete")).toBe(true);
				expect(pm.tester.saveButtonIsVisible()).toBe(true);
				expect(pm.tester.collectionListIsOpen(1)).toBe(true);

				pm.tester.openEditCollectionRequestModal(1, 2);

				setTimeout(function() {
					isSecondModalOpen = true;
				}, codeMirrorModalWaitTime);
			});

			waitsFor(function() {
				return isSecondModalOpen === true;
			}, "Could not open edit collection modal", codeMirrorWaitTime);

			runs(function() {
				var params = {
					"requestName": "DELETE all of this",
					"requestDescription": "An edited delete!"
				};

				pm.tester.addDataToEditRequestCollectionModal(params);
				pm.tester.submitEditCollectionRequestModal();

				setTimeout(function() {
					isSecondModalSubmitted = true;
				}, modalWaitTime);
			});

			waitsFor(function() {
				return isSecondModalSubmitted === true;
			}, "Could not submit edit collection request modal", waitTime);

			runs(function() {
				expect(pm.tester.collectionSidebarHasString("DELETE all of this")).toBe(true);
				expect(pm.tester.requestMetaSectionVisibility()).toBe("block");
				expect(pm.tester.requestMetaNameHas("DELETE all of this")).toBe(true);
				expect(pm.tester.requestMetaDescriptionHas("An edited delete")).toBe(true);
			});
		});

		it("can delete a collection request", function() {
			var isOpen = false;
			var isSubmitted = false;

			runs(function() {
				// Open delete collection modal for first index
				pm.tester.openDeleteCollectionRequestModalForIndex(1, 2);
				setTimeout(function() {
					isOpen = true;
				}, modalWaitTime);
			});

			waitsFor(function() {
				return isOpen === true;
			}, "could not open modal", modalWaitTime);

			runs(function() {
				pm.tester.submitDeleteCollectionRequestModal();
				setTimeout(function() {
					isSubmitted = true;
				}, modalWaitTime);
			});

			waitsFor(function() {
				return isSubmitted === true;
			}, "could not submit", modalWaitTime);

			runs(function() {
				//Check if the collection is gone
				expect(pm.tester.collectionSidebarHasString("DELETE all of this")).toBe(false);
			});
		});
	});

	describe("load collection request in editor", function() {
		beforeEach(function() {

		});

		afterEach(function() {
			// var isDataRemoved = false;

			// runs(function() {
			// 	var collection = mockCollection;
			// 	pm.collections.deleteCollection(collection.id, false, function() {
			// 		isDataRemoved = true;
			// 	});
			// });

			// waitsFor(function() {
			// 	return isDataRemoved === true;
			// }, "Could not remove collection", waitTime);
		});

		it("can load a POST formdata request in editor", function() {
			var isDataAdded = false;
			var collectionItemLoaded = false;

			runs(function() {
				var collection = mockCollection;
				pm.collections.addAsNewCollection(collection, false);
				setTimeout(function() {
					isDataAdded = true;
				}, 200);
			});

			waitsFor(function() {
				return isDataAdded === true;
			}, "Could not add data", waitTime);

			runs(function() {
				pm.tester.selectCollectionRequest(2, 1);
				setTimeout(function() {
					collectionItemLoaded = true;
				}, 250);
			});

			waitsFor(function() {
				return collectionItemLoaded === true;
			}, "Collection item not loaded", waitTime);

			runs(function() {
				expect(pm.tester.urlHasString("http://localhost:5000/post")).toBe(true);
				expect(pm.tester.methodIs("POST"));
				expect(pm.tester.bodyTypeIs("params")).toBe(true);
			});
		});

		it("can load a POST urlencoded request in editor", function() {
			var collectionItemLoaded = false;

			runs(function() {
				pm.tester.selectCollectionRequest(2, 2);

				setTimeout(function() {
					collectionItemLoaded = true;
				}, 250);
			});

			waitsFor(function() {
				return collectionItemLoaded === true;
			}, "URLEncoded collection item not loaded", waitTime);

			runs(function() {
				expect(pm.tester.urlHasString("http://localhost:5000/post")).toBe(true);
				expect(pm.tester.methodIs("POST"));
				expect(pm.tester.bodyTypeIs("urlencoded")).toBe(true);
			});
		});

		it("can load a POST raw request in editor", function() {
			var collectionItemLoaded = false;

			runs(function() {
				pm.tester.selectCollectionRequest(2, 3);

				setTimeout(function() {
					collectionItemLoaded = true;
				}, 250);
			});

			waitsFor(function() {
				return collectionItemLoaded === true;
			}, "Raw collection item not loaded", waitTime);

			runs(function() {
				expect(pm.tester.urlHasString("http://localhost:5000/post")).toBe(true);
				expect(pm.tester.methodIs("POST"));
				expect(pm.tester.bodyTypeIs("raw")).toBe(true);
			});
		});


		describe("save collection responses", function() {
			it("can save response in a collection request", function() {
				var collectionItemLoaded = false;
				var responseLoaded = false;
				var responseSaved = false;

				runs(function() {
					pm.tester.selectCollectionRequest(2, 2);

					setTimeout(function() {
						collectionItemLoaded = true;
					}, 250);
				});

				waitsFor(function() {
					return collectionItemLoaded === true;
				}, "URLEncoded collection item not loaded", waitTime);

				runs(function() {
					expect(pm.tester.urlHasString("http://localhost:5000/post")).toBe(true);
					expect(pm.tester.methodIs("POST"));
					expect(pm.tester.bodyTypeIs("urlencoded")).toBe(true);

					pm.tester.submitRequest();

					var response = pm.request.get("response");
					response.on("loadResponse", function() {
						responseLoaded = true;
					});
				});

				waitsFor(function() {
					return responseLoaded === true;
				}, "Could not get response", waitTime);

				runs(function() {
					var foundString = pm.tester.prettyBodyHasString("/post");
					expect(foundString).toBe(true);

					pm.tester.clickOnSaveSampleResponseButton();
					pm.tester.setSampleResponseName("200 OK");
					pm.tester.saveSampleResponse();

					setTimeout(function() {
						responseSaved = true;
					}, 250);
				});

				waitsFor(function() {
					return responseSaved === true;
				}, "Could not save response", waitTime);

				runs(function() {
					expect(pm.tester.sampleResponseListHas("200 OK")).toBe(true);
				});
			});

			it("can load collection responses", function() {
				var collectionItemLoaded = false;
				var responseLoaded = false;

				runs(function() {
					pm.tester.selectCollectionRequest(2, 2);

					setTimeout(function() {
						collectionItemLoaded = true;
					}, 250);
				});

				waitsFor(function() {
					return collectionItemLoaded === true;
				}, "URLEncoded collection item not loaded", waitTime);

				runs(function() {
					pm.tester.loadSampleResponse(1);

					setTimeout(function() {
						responseLoaded = true;
					}, 250);
				});

				waitsFor(function() {
					return responseLoaded === true;
				}, "Could not load response", waitTime);

				runs(function() {
					var found = pm.tester.prettyBodyHasString("/post");
					expect(found).toBe(true);
				});
			});

			it("can delete response from a collection request", function() {
				var collectionItemLoaded = false;
				var responseDeleted = false;

				runs(function() {
					pm.tester.selectCollectionRequest(2, 2);

					setTimeout(function() {
						collectionItemLoaded = true;
					}, 250);
				});

				waitsFor(function() {
					return collectionItemLoaded === true;
				}, "URLEncoded collection item not loaded", waitTime);

				runs(function() {
					pm.tester.deleteSampleResponse(1);

					setTimeout(function() {
						responseDeleted = true;
					}, 250);
				});

				waitsFor(function() {
					return responseDeleted === true;
				}, "Could not delete response", waitTime);

				runs(function() {
					expect(pm.tester.sampleResponseListHas("200 OK")).toBe(false);
				});
			});
		});
	});

	xdescribe("import collection", function() {
		it("can overwrite collections", function() {

		});

		it("can add a duplicate collection", function() {

		});

		it("can merge two collections with the same collection id", function() {

		});
	});

	xdescribe("share a collection", function() {
		//TODO Use a spy here and ensure that the collection function was called
	});

	xdescribe("search within collections", function() {

	});
});