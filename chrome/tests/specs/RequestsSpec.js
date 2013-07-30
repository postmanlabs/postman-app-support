describe("Postman requester", function() {
	var waitTime = 500;

	describe("can send basic requests", function() {
		beforeEach(function() {
			pm.tester.resetRequest();
		});

		afterEach(function() {
			pm.tester.resetRequest();
		});

		it("can send a basic GET request", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/get");
				pm.tester.setMethod("GET");
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
				var foundString = pm.tester.prettyBodyHasString("/get");				
				expect(foundString).toBe(true);		
			});
		});

		it("can send a basic GET request where the URL has just one key", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/get?start");
				pm.tester.setMethod("GET");
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
				var found = pm.tester.prettyBodyHasString("/get\\?start");				
				expect(found).toBe(true);		
			});
		});

		it("can send a basic DELETE request", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/delete");
				pm.tester.setMethod("DELETE");
				pm.tester.submitRequest();	

				var response = pm.request.get("response");
				response.on("loadResponse", function() {		
					responseLoaded = true;
				});							
			});

			waitsFor(function() {
				return responseLoaded === true;
			}, "loadResponse not triggered", waitTime);

			runs(function() {				
				var found = pm.tester.prettyBodyHasString("/delete");				
				expect(found).toBe(true);		
			});
		});

		it("can send a basic HEAD request", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/head");
				pm.tester.setMethod("HEAD");
				pm.tester.submitRequest();		

				var response = pm.request.get("response");
				response.on("loadResponse", function() {					
					responseLoaded = true;
				});						
			});

			waitsFor(function() {
				return responseLoaded === true;
			}, "Could not load the response", waitTime);

			runs(function() {				
				var found = pm.tester.areHeadersVisible();				
				expect(found).toBe(true);		
			});
		});

		it("can send a basic OPTIONS request", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/html");
				pm.tester.setMethod("OPTIONS");
				pm.tester.submitRequest();	

				var response = pm.request.get("response");
				response.on("loadResponse", function() {					
					responseLoaded = true;
				});							
			});

			waitsFor(function() {
				return responseLoaded === true;
			}, "Could not load the response", waitTime);

			runs(function() {				
				var found = pm.tester.isResponseVisible();
				expect(found).toBe(true);		
			});
		});		

		it("can send a basic PUT request", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/put");
				pm.tester.setMethod("PUT");
				pm.tester.submitRequest();	

				var response = pm.request.get("response");
				response.on("loadResponse", function() {					
					responseLoaded = true;
				});							
			});

			waitsFor(function() {
				return responseLoaded === true;
			}, "Could not load the response", waitTime);

			runs(function() {				
				var found = pm.tester.prettyBodyHasString("/put");				
				expect(found).toBe(true);		
			});
		});
	});	

	describe("can handle URLs", function() {
		beforeEach(function() {
			pm.tester.resetRequest();
		});

		afterEach(function() {
			pm.tester.resetRequest();
		});

		it("can send a URL with a semicolon", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/get?some=start;val");
				pm.tester.setMethod("GET");
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
				var foundString = pm.tester.prettyBodyHasString("some=start;val");				
				expect(foundString).toBe(true);		
			});
		});

		it("can send an odata URL", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/get?Resource(code1='1',code2='1')");
				pm.tester.setMethod("GET");
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
				expect(pm.tester.prettyBodyHasString("Resource")).toBe(true);
				expect(pm.tester.prettyBodyHasString("code1")).toBe(true);
			});
		});
	});

	describe("can send GET requests", function() {
		beforeEach(function() {
			pm.tester.resetRequest();
		});

		afterEach(function() {
			pm.tester.resetRequest();
		});

		it("can edit and send URL params", function() {

		});
	});

	describe("can send POST requests", function() {
		beforeEach(function() {
			pm.tester.resetRequest();
		});

		afterEach(function() {
			pm.tester.resetRequest();
		});

		it("can send a basic POST request", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/post");
				pm.tester.setMethod("POST");
				pm.tester.submitRequest();								

				var response = pm.request.get("response");
				response.on("loadResponse", function() {					
					responseLoaded = true;
				});
			});

			waitsFor(function() {
				return responseLoaded === true;
			}, "Could not load the response", waitTime);

			runs(function() {				
				var found = pm.tester.prettyBodyHasString("/post");				
				expect(found).toBe(true);
			});
		});

		it("can send a multipart/formdata request", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/post");
				pm.tester.setMethod("POST");
				var params = [
					{ key: "Foo", value: "bar" },
					{ key: "Test", value: "This" },
					{ key: "Damn", value: "Thing" }
				];

				pm.tester.setFormDataParams(params);
				pm.tester.submitRequest();		

				var response = pm.request.get("response");
				response.on("loadResponse", function() {					
					responseLoaded = true;
				});						
			});

			waitsFor(function() {
				return responseLoaded === true;
			}, "Could not load the response", waitTime);

			runs(function() {				
				expect(pm.tester.prettyBodyHasString("/post")).toBe(true);
				expect(pm.tester.prettyBodyHasString("multipart")).toBe(true);
				expect(pm.tester.prettyBodyHasString("Damn")).toBe(true);
			});
		});

		it("can send a urlencoded request", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/post");
				pm.tester.setMethod("POST");
				var params = [
					{ key: "Foo", value: "bar" },
					{ key: "Test", value: "This" },
					{ key: "Damn", value: "Thing" }
				];

				pm.tester.setBodyType("urlencoded");
				pm.tester.setURLEncodedParams(params);
				pm.tester.submitRequest();		

				var response = pm.request.get("response");
				response.on("loadResponse", function() {					
					responseLoaded = true;
				});						
			});

			waitsFor(function() {
				return responseLoaded === true;
			}, "Could not load the response", waitTime);

			runs(function() {				
				expect(pm.tester.prettyBodyHasString("/post")).toBe(true);
				expect(pm.tester.prettyBodyHasString("urlencoded")).toBe(true);
				expect(pm.tester.prettyBodyHasString("Damn")).toBe(true);
			});
		});

		it("can send a raw request", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/post");
				pm.tester.setMethod("POST");

				var data = "blahblahblah";

				pm.tester.setBodyType("raw");
				pm.tester.setRawData(data);
				pm.tester.submitRequest();		

				var response = pm.request.get("response");
				response.on("loadResponse", function() {					
					responseLoaded = true;
				});						
			});

			waitsFor(function() {
				return responseLoaded === true;
			}, "Could not load the response", waitTime);

			runs(function() {				
				expect(pm.tester.prettyBodyHasString("/post")).toBe(true);
				expect(pm.tester.prettyBodyHasString("blahblahblah")).toBe(true);
			});
		});

		it("can send a raw application/json request", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/post");
				pm.tester.setMethod("POST");

				var data = "blahblahblah";

				pm.tester.setBodyType("raw");
				pm.tester.setRawData(data);
				var headers = [
					{ key: "Content-Type", value: "application/json" }
				];

				pm.tester.setHeaders(headers);
				pm.tester.submitRequest();		

				var response = pm.request.get("response");
				response.on("loadResponse", function() {					
					responseLoaded = true;
				});						
			});

			waitsFor(function() {
				return responseLoaded === true;
			}, "Could not load the response", waitTime);

			runs(function() {				
				expect(pm.tester.prettyBodyHasString("/post")).toBe(true);
				expect(pm.tester.prettyBodyHasString("blahblahblah")).toBe(true);
				expect(pm.tester.prettyBodyHasString("application\/json")).toBe(true);
			});
		});
	});

	describe("can add extra headers", function() {
		it("can send a no-cache header", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/get");
				pm.tester.setMethod("GET");
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
				var foundString = pm.tester.prettyBodyHasString("no-cache");				
				expect(foundString).toBe(true);		
			});
		});	

		it("can disable no-cache header", function() {
			var responseLoaded = false;
			runs(function() {
				pm.settings.setSetting("sendNoCacheHeader", false);
				pm.tester.setUrl("http://localhost:5000/get");
				pm.tester.setMethod("GET");
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
				var foundString = pm.tester.prettyBodyHasString("no-cache");				
				expect(foundString).toBe(false);		
			});
		});	

		it("can send postman-token header", function() {
			var responseLoaded = false;
			runs(function() {
				pm.settings.setSetting("sendPostmanTokenHeader", true);
				pm.tester.setUrl("http://localhost:5000/get");
				pm.tester.setMethod("GET");
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
				var foundString = pm.tester.prettyBodyHasString("Postman-Token");				
				expect(foundString).toBe(true);		
			});
		});

		it("can disable postman-token header", function() {
			var responseLoaded = false;
			runs(function() {
				pm.settings.setSetting("sendPostmanTokenHeader", false);
				pm.tester.setUrl("http://localhost:5000/get");
				pm.tester.setMethod("GET");
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
				var foundString = pm.tester.prettyBodyHasString("Postman-Token");				
				expect(foundString).toBe(false);		
			});
		});
	});
});