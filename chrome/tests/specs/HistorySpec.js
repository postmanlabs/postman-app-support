describe("History ", function() {
	var waitTime = 500;

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
		// pm.tester.resetHistory();
	});

	it("has initialized Postman", function() {
		expect(pm.hasPostmanInitialized).toBe(true);
	});

	it("shows empty history message", function() {
		expect(pm.tester.historyHasString("Nothing in your history yet")).toBe(true);
	});

	it("load a GET request from history", function() {
		var mockDataLoaded = false;
		var historyItemLoaded = false;
		runs(function() {
			var request = {"url":"http://localhost:5000/get","method":"GET","headers":"","data":[],"dataMode":"params","timestamp":1375432867383,"version":2};
			pm.history.addRequest(request.url, request.method, request.headers, request.data, request.dataMode);

		});

		runs(function() {
			setTimeout(function() {
				mockDataLoaded = pm.tester.historyHasString("http://localhost:5000/get");
			}, 200);
		});

		waitsFor(function() {
			return mockDataLoaded === true;
		}, "Mock data not loaded", 250);

		runs(function() {
			pm.request.on("loadRequest", function() {
				historyItemLoaded = true;
			});
			pm.tester.selectHistoryItem(1);
		});

		waitsFor(function() {
			return historyItemLoaded === true;
		}, "History item not loaded", 200);

		runs(function() {
			expect(pm.tester.urlHasString("http://localhost:5000/get")).toBe(true);
			expect(pm.tester.methodIs("GET"));
		});
	});

	it("save a form-data POST request in history", function() {
		var mockDataLoaded = false;
		var historyItemLoaded = false;
		runs(function() {
			var request = {"id":"8d2bee7c-9997-6aa3-996f-3091c8bb86f3","url":"http://localhost:5000/post","method":"POST","headers":"","data":[{"key":"this","value":"is","type":"text"},{"key":"got","value":"to","type":"text"},{"key":"be","value":"amazing","type":"text"}],"dataMode":"params","timestamp":1375434536482,"version":2};
			pm.history.addRequest(request.url, request.method, request.headers, request.data, request.dataMode);
		});

		runs(function() {
			setTimeout(function() {
				mockDataLoaded = pm.tester.historyHasString("http://localhost:5000/post");
			}, 250);
		});

		waitsFor(function() {
			return mockDataLoaded === true;
		}, "Mock data not loaded", 250);

		runs(function() {
			pm.request.on("loadRequest", function() {
				historyItemLoaded = true;
			});
			pm.tester.selectHistoryItem(1);
		});

		waitsFor(function() {
			return historyItemLoaded === true;
		}, "History item not loaded", 200);

		runs(function() {
			expect(pm.tester.urlHasString("http://localhost:5000/post")).toBe(true);
			expect(pm.tester.methodIs("POST"));
			expect(pm.tester.bodyTypeIs("params")).toBe(true);
		});
	});

	it("save a urlencoded POST request in history", function() {
		var mockDataLoaded = false;
		var historyItemLoaded = false;
		runs(function() {
			var request = {"id":"ce154a95-caa0-7b6c-3381-6d4bcf4228d1","url":"http://localhost:5000/post","method":"POST","headers":"","data":[{"key":"wow","value":"this","type":"text"},{"key":"is","value":"cool","type":"text"}],"dataMode":"urlencoded","timestamp":1375434922252,"version":2};
			pm.history.addRequest(request.url, request.method, request.headers, request.data, request.dataMode);
		});

		runs(function() {
			setTimeout(function() {
				mockDataLoaded = pm.tester.historyHasString("http://localhost:5000/post");
			}, 150);
		});

		waitsFor(function() {
			return mockDataLoaded === true;
		}, "Mock data not loaded", 100);

		runs(function() {
			pm.request.on("loadRequest", function() {
				historyItemLoaded = true;
			});
			pm.tester.selectHistoryItem(1);
		});

		waitsFor(function() {
			return historyItemLoaded === true;
		}, "History item not loaded", 250);

		runs(function() {
			expect(pm.tester.urlHasString("http://localhost:5000/post")).toBe(true);
			expect(pm.tester.methodIs("POST"));
			expect(pm.tester.bodyTypeIs("urlencoded")).toBe(true);
		});
	});

	it("save a raw PUT request in history", function() {
		var mockDataLoaded = false;
		var historyItemLoaded = false;
		runs(function() {
			var request = {"id":"6a3a7ab6-7d5b-5752-3a1d-bd45112138ac","url":"http://localhost:5000/put","method":"PUT","headers":"Content-Type: application/json\n","data":"{\n  \"key\": \"value\"\n}","dataMode":"raw","timestamp":1375434972663,"version":2};
			pm.history.addRequest(request.url, request.method, request.headers, request.data, request.dataMode);
		});

		runs(function() {
			setTimeout(function() {
				mockDataLoaded = pm.tester.historyHasString("http://localhost:5000/post");
			}, 100);
		});

		waitsFor(function() {
			return mockDataLoaded === true;
		}, "Mock data not loaded", 100);

		runs(function() {
			pm.request.on("loadRequest", function() {
				historyItemLoaded = true;
			});
			pm.tester.selectHistoryItem(1);
		});

		waitsFor(function() {
			return historyItemLoaded === true;
		}, "History item not loaded", 200);

		runs(function() {
			expect(pm.tester.urlHasString("http://localhost:5000/put")).toBe(true);
			expect(pm.tester.methodIs("PUT"));
			expect(pm.tester.bodyTypeIs("raw")).toBe(true);
		});
	});

	it("save a raw binary request in history", function() {
		var mockDataLoaded = false;
		var historyItemLoaded = false;
		runs(function() {
			var request = {"id":"ad9aa13c-4872-fe29-4e4d-ddaf73113c6b","url":"http://localhost:5000/post","method":"POST","headers":"Content-Type: application/json\n","dataMode":"binary","timestamp":1375434999646,"version":2};
			pm.history.addRequest(request.url, request.method, request.headers, request.data, request.dataMode);
		});

		runs(function() {
			setTimeout(function() {
				mockDataLoaded = pm.tester.historyHasString("http://localhost:5000/post");
			}, 100);
		});

		waitsFor(function() {
			return mockDataLoaded === true;
		}, "Mock data not loaded", 100);

		runs(function() {
			pm.request.on("loadRequest", function() {
				historyItemLoaded = true;
			});
			pm.tester.selectHistoryItem(1);
		});

		waitsFor(function() {
			return historyItemLoaded === true;
		}, "History item not loaded", 200);

		runs(function() {
			expect(pm.tester.urlHasString("http://localhost:5000/post")).toBe(true);
			expect(pm.tester.methodIs("POST"));
			expect(pm.tester.bodyTypeIs("binary")).toBe(true);
		});
	});

	it("delete a history request", function() {
		var mockDataLoaded = false;
		var historyItemLoaded = false;
		var historyItemRemoved = false;
		runs(function() {
			var request = {"id":"ad9aa13c-4872-fe29-4e4d-ddaf73113c6b","url":"http://localhost:5000/deletethisitem","method":"POST","headers":"Content-Type: application/json\n","dataMode":"binary","timestamp":1375434999646,"version":2};
			pm.history.addRequest(request.url, request.method, request.headers, request.data, request.dataMode);
		});

		runs(function() {
			setTimeout(function() {
				mockDataLoaded = pm.tester.historyHasString("http://localhost:5000/deletethisitem");
			}, 100);
		});

		waitsFor(function() {
			return mockDataLoaded === true;
		}, "Mock data not loaded", 100);

		runs(function() {
			pm.request.on("loadRequest", function() {
				historyItemLoaded = true;
			});
			pm.tester.selectHistoryItem(1);
		});

		waitsFor(function() {
			return historyItemLoaded === true;
		}, "History item not loaded", 200);

		runs(function() {
			expect(pm.tester.urlHasString("http://localhost:5000/deletethisitem")).toBe(true);
		});

		runs(function() {
			pm.tester.deleteHistoryItem(1);

			setTimeout(function() {
				historyItemRemoved = !pm.tester.historyHasString("http://localhost:5000/deletethisitem");
			}, 100);
		});

		waitsFor(function() {
			return historyItemRemoved === true;
		}, "Could not delete history item", 200);
	});

	it("it can remove all history requests with clear button", function() {
		var allItemsRemoved = false;

		runs(function() {
			pm.tester.resetHistory();
			setTimeout(function() {
				allItemsRemoved = pm.tester.historyHasString("Nothing in your history");
			}, 100);
		});

		waitsFor(function() {
			return allItemsRemoved === true;
		}, "Could not remove all history items", 200);
	});
});