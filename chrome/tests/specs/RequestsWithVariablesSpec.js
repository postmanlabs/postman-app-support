describe("Postman requests with variables", function() {
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
		pm.tester.resetRequest();
	});

	it("has initialized Postman", function() {		
		expect(pm.hasPostmanInitialized).toBe(true);		
		pm.tester.addTestEnvironments();
		pm.tester.addTestGlobals();
	});
	
	describe("can set variables in the URL", function() {
		it("the URL is set in the environment variable", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setEnvironmentByName("test_env_1");

				pm.tester.setUrl("{{full_url}}");
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
				expect(pm.tester.prettyBodyHasString("get")).toBe(true);
			});
		});

		it("the URL is set in a global variable", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setEnvironmentByName("test_env_1");

				pm.tester.setUrl("{{full_global_url}}");
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
				expect(pm.tester.prettyBodyHasString("get")).toBe(true);
			});			
		});

		it("partial URL is set in an environment variable", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setEnvironmentByName("test_env_1");

				pm.tester.setUrl("http://localhost:5000/{{resource_get}}");
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
				expect(pm.tester.prettyBodyHasString("get")).toBe(true);
			});
		});

		it("partial URL is set in a global variable", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setEnvironmentByName("test_env_1");

				pm.tester.setUrl("http://localhost:5000/{{global_resource_get}}");
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
				expect(pm.tester.prettyBodyHasString("get")).toBe(true);
			});
		});

		it("partial URL has multiple variables", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setEnvironmentByName("test_env_1");

				pm.tester.setUrl("{{base_url}}/{{global_resource_get}}?v={{v}}&a={{v}}");
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
				expect(pm.tester.prettyBodyHasString("v=test")).toBe(true);
				expect(pm.tester.prettyBodyHasString("a=test")).toBe(true);
			});
		});
	});

	describe("can send variables in the request body", function() {		
		it("can send a multipart/formdata request with variables", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setEnvironmentByName("test_env_1");
				pm.tester.setUrl("http://localhost:5000/{{resource_post}}");
				pm.tester.setMethod("POST");
				var params = [
					{ key: "Foo", value: "{{Foo}}" },
					{ key: "Test", value: "{{Test}}" }
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
				expect(pm.tester.prettyBodyHasString("bar")).toBe(true);
				expect(pm.tester.prettyBodyHasString("This")).toBe(true);
			});
		});

		it("can send a urlencoded request with variables", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/post");
				pm.tester.setMethod("POST");
				var params = [
					{ key: "Foo", value: "{{Foo}}" },
					{ key: "Test", value: "{{Test}}" }
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
				expect(pm.tester.prettyBodyHasString("bar")).toBe(true);
				expect(pm.tester.prettyBodyHasString("This")).toBe(true);
			});
		});

		it("can send a raw request with variables", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/post");
				pm.tester.setMethod("POST");

				var data = "{{Foo}}";

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
				expect(pm.tester.prettyBodyHasString("bar")).toBe(true);
			});
		});
	});

	describe("can set variables in the headers", function() {
		it("can set a header value in a variable", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/get");
				pm.tester.setMethod("GET");

				var headers = [
					{ key: "Content-Type", value: "{{header_json}}" }
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
			}, "Could not get response", waitTime);

			runs(function() {
				expect(pm.tester.prettyBodyHasString("application\\/json")).toBe(true);
			});
		});
	});

	describe("can set variables in the URL params editor", function() {		
		it("can set partial and entire values as variables", function() {
			var responseLoaded = false;
			var haveSetParams = false;
			runs(function() {
				pm.tester.setUrl("http://localhost:5000/post");
				pm.tester.setMethod("POST");
				pm.tester.toggleURLParams();

				var urlParams = [
					{ key: "Foo", value: "{{Foo}}" },
					{ key: "Test", value: "{{Test}}" }
				];

				pm.tester.setURLParams(urlParams);		

				setTimeout(function() {
					haveSetParams = true;
				}, 100);		
			});

			waitsFor(function() {
				return haveSetParams === true;
			}, "could not set URL params", 150);

			runs(function() {								
				pm.tester.submitRequest();								

				console.log(pm.request.get("url"));

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
				expect(pm.tester.prettyBodyHasString("bar")).toBe(true);
				expect(pm.tester.prettyBodyHasString("This")).toBe(true);
			});
		});
	});

});