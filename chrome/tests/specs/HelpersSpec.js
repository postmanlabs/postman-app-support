describe("Postman helpers", function() {
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
		pm.tester.addTestEnvironments();
		pm.tester.addTestGlobals();
	});	

	describe("basic helper", function() {
		it("can generate basic auth header", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setBasicAuthParams({
					username: "Aladin",
					password: "sesam open"
				});

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
				expect(pm.tester.prettyBodyHasString("Authorization")).toBe(true);
				expect(pm.tester.prettyBodyHasString("Basic QWxhZGluOnNlc2FtIG9wZW4\\=")).toBe(true);				
			});
		});

		it("can generate basic auth header with variables", function() {
			var responseLoaded = false;
			runs(function() {
				pm.tester.setEnvironmentByName("test_basic_env");

				pm.tester.setBasicAuthParams({
					username: "{{username}}",
					password: "{{password}}"
				});

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
				expect(pm.tester.prettyBodyHasString("Authorization")).toBe(true);
				expect(pm.tester.prettyBodyHasString("Basic QWxhZGluOnNlc2FtIG9wZW4\\=")).toBe(true);				
			});
		});
	});

	describe("digest helper", function() {
		it("can generate a digest header for a get request", function() {
			var refreshed = false;
			runs(function() {
				pm.tester.setUrl("http://httpbin.org/digest-auth/auth/user/pass");
				pm.tester.setMethod("GET");

				pm.tester.setDigestAuthParams({
					username: "user",
					realm: "me@kennethreitz.com",
					password: "pass",
					nonce: "59c177ca4c8aa616a0e0007717a2225d",
					algorithm: "MD5",
					qop: "auth",
					nonce_count: "00000002",
					client_nonce: "a621deed62b2ff96",
					opaque: "c68f9b6d2ccdf56c49945e0788fd1017"
				});				

				setTimeout(function() {
					refreshed = true;
				}, 100);
			});

			waitsFor(function() {
				return refreshed === true;
			}, "Could not get response", waitTime);

			runs(function() {				
				var auth = pm.tester.getHeaderValue("Authorization");
				var found = auth.search("bf0ed74d6a422565ba9aae6d0e36f7b9") >= 0;
				expect(found).toBe(true);
			});
		});

		it("can generate a digest header for a get request with variables", function() {
			var refreshed = false;
			runs(function() {
				pm.tester.setEnvironmentByName("test_digest_env");

				pm.tester.setUrl("http://httpbin.org/digest-auth/auth/user/pass");
				pm.tester.setMethod("GET");

				pm.tester.setDigestAuthParams({
					username: "{{username}}",
					realm: "{{realm}}",
					password: "{{password}}",
					nonce: "{{nonce}}",
					algorithm: "{{algorithm}}",
					qop: "{{qop}}",
					nonce_count: "{{nonce_count}}",
					client_nonce: "{{client_nonce}}",
					opaque: "{{opaque}}"
				});				

				setTimeout(function() {
					refreshed = true;
				}, 100);
			});

			waitsFor(function() {
				return refreshed === true;
			}, "Could not get response", waitTime);

			runs(function() {				
				var auth = pm.tester.getHeaderValue("Authorization");
				var found = auth.search("bf0ed74d6a422565ba9aae6d0e36f7b9") >= 0;
				expect(found).toBe(true);
			});
		});
	});

	describe("oauth helper", function() {
		it("can generate oauth1.0 params for get request", function() {
			var refreshed = false;
			runs(function() {
				pm.tester.setUrl("http://photos.example.net/photos?size=original&file=vacation.jpg");
				pm.tester.setMethod("GET");

				pm.tester.setOAuth1Params({
					"consumer_key": "dpf43f3p2l4k3l03",
					"consumer_secret": "kd94hf93k423kf44",
					"token": "nnch734d00sl2jdk",
					"token_secret": "pfkkdhi9sl3r4s00",
					"signature_method": "HMAC-SHA1",
					"timestamp": "1191242096",
					"nonce": "kllo9940pd9333jh",
					"version": "1.0",
					"realm": "",
					"header": false,
					"auto": false
				});				

				setTimeout(function() {
					refreshed = true;
				}, 100);
			});

			waitsFor(function() {
				return refreshed === true;
			}, "Could not get response", waitTime);

			runs(function() {
				var params = pm.tester.getURLParams();

				var pair = {
					"key": "oauth_signature",
					"value": "tR3+Ty81lMeYAr/Fid0kMTYa/WM="
				};

				var found = pm.tester.kvpairExistsInArray(params, pair);
				expect(found).toBe(true);
			});
		});

		it("can generate oauth1.0 params for formdata post request", function() {
			var refreshed = false;
			runs(function() {
				pm.tester.setUrl("http://photos.example.net/photos");			
				pm.tester.setMethod("POST");
				var params = [
					{ key: "size", value: "original" },
					{ key: "file", value: "vacation.jpg" }
				];
				pm.tester.setBodyType("params");
				pm.tester.setFormDataParams(params);

				pm.tester.setOAuth1Params({
					"consumer_key": "dpf43f3p2l4k3l03",
					"consumer_secret": "kd94hf93k423kf44",
					"token": "nnch734d00sl2jdk",
					"token_secret": "pfkkdhi9sl3r4s00",
					"signature_method": "HMAC-SHA1",
					"timestamp": "1191242096",
					"nonce": "kllo9940pd9333jh",
					"version": "1.0",
					"realm": "",
					"header": false,
					"auto": false
				});				

				setTimeout(function() {
					refreshed = true;
				}, 100);
			});

			waitsFor(function() {
				return refreshed === true;
			}, "Could not get response", waitTime);

			runs(function() {
				var params = pm.tester.getFormDataParams();

				var pair = {
					"key": "oauth_signature",					
					"value": "wPkvxykrw+BTdCcGqKr+3I+PsiM="
				};

				var found = pm.tester.kvpairExistsInArray(params, pair);
				expect(found).toBe(true);

				var bodyPair = {
					"key": "size",
					"value": "original"
				};

				expect(pm.tester.kvpairExistsInArray(params, bodyPair)).toBe(true);
			});
		});

		it("can generate oauth1.0 params for formdata post request but missing http in the url", function() {
			var refreshed = false;
			runs(function() {
				pm.tester.setUrl("photos.example.net/photos");			
				pm.tester.setMethod("POST");
				pm.tester.setBodyType("params");
				var params = [
					{ key: "size", value: "original" },
					{ key: "file", value: "vacation.jpg" }
				];

				pm.tester.setFormDataParams(params);

				pm.tester.setOAuth1Params({
					"consumer_key": "dpf43f3p2l4k3l03",
					"consumer_secret": "kd94hf93k423kf44",
					"token": "nnch734d00sl2jdk",
					"token_secret": "pfkkdhi9sl3r4s00",
					"signature_method": "HMAC-SHA1",
					"timestamp": "1191242096",
					"nonce": "kllo9940pd9333jh",
					"version": "1.0",
					"realm": "",
					"header": false,
					"auto": false
				});				

				setTimeout(function() {
					refreshed = true;
				}, 100);
			});

			waitsFor(function() {
				return refreshed === true;
			}, "Could not get response", waitTime);

			runs(function() {
				var params = pm.tester.getFormDataParams();

				var pair = {
					"key": "oauth_signature",					
					"value": "wPkvxykrw+BTdCcGqKr+3I+PsiM="
				};

				var found = pm.tester.kvpairExistsInArray(params, pair);
				expect(found).toBe(true);

				var bodyPair = {
					"key": "size",
					"value": "original"
				};

				expect(pm.tester.kvpairExistsInArray(params, bodyPair)).toBe(true);
			});			
		});

		it("can generate oauth1.0 params for urlencoded post request", function() {
			var refreshed = false;
			runs(function() {
				pm.tester.setUrl("http://photos.example.net/photos");			
				pm.tester.setMethod("POST");
				var params = [
					{ key: "size", value: "original" },
					{ key: "file", value: "vacation.jpg" }
				];

				pm.tester.setBodyType("urlencoded");
				pm.tester.setURLEncodedParams(params);

				pm.tester.setOAuth1Params({
					"consumer_key": "dpf43f3p2l4k3l03",
					"consumer_secret": "kd94hf93k423kf44",
					"token": "nnch734d00sl2jdk",
					"token_secret": "pfkkdhi9sl3r4s00",
					"signature_method": "HMAC-SHA1",
					"timestamp": "1191242096",
					"nonce": "kllo9940pd9333jh",
					"version": "1.0",
					"realm": "",
					"header": false,
					"auto": false
				});				

				setTimeout(function() {
					refreshed = true;
				}, 100);
			});

			waitsFor(function() {
				return refreshed === true;
			}, "Could not get response", waitTime);

			runs(function() {
				var params = pm.tester.getURLEncodedParams();

				var pair = {
					"key": "oauth_signature",					
					"value": "wPkvxykrw+BTdCcGqKr+3I+PsiM="
				};

				var found = pm.tester.kvpairExistsInArray(params, pair);
				expect(found).toBe(true);

				var bodyPair = {
					"key": "size",
					"value": "original"
				};

				expect(pm.tester.kvpairExistsInArray(params, bodyPair)).toBe(true);
			});
		});

		it("can generate oauth1.0 header for formdata post request", function() {
			var refreshed = false;
			runs(function() {
				pm.tester.setUrl("http://photos.example.net/photos");			
				pm.tester.setMethod("POST");
				var params = [
					{ key: "size", value: "original" },
					{ key: "file", value: "vacation.jpg" }
				];

				pm.tester.setBodyType("params");
				pm.tester.setFormDataParams(params);

				pm.tester.setOAuth1Params({
					"consumer_key": "dpf43f3p2l4k3l03",
					"consumer_secret": "kd94hf93k423kf44",
					"token": "nnch734d00sl2jdk",
					"token_secret": "pfkkdhi9sl3r4s00",
					"signature_method": "HMAC-SHA1",
					"timestamp": "1191242096",
					"nonce": "kllo9940pd9333jh",
					"version": "1.0",
					"realm": "",
					"header": true,
					"auto": false
				});				

				setTimeout(function() {
					refreshed = true;
				}, 100);
			});

			waitsFor(function() {
				return refreshed === true;
			}, "Could not get response", waitTime);

			runs(function() {				
				var params = pm.tester.getFormDataParams();
				var auth = pm.tester.getHeaderValue("Authorization");
				var found = auth.search("wPkvxykrw%2BBTdCcGqKr%2B3I%2BPsiM%3D") >= 0;
				expect(found).toBe(true);

				var bodyPair = {
					"key": "size",
					"value": "original"
				};

				expect(pm.tester.kvpairExistsInArray(params, bodyPair)).toBe(true);
			});
		});

		it("can generate oauth1.0 params for formdata post request with variables", function() {
			var refreshed = false;
			runs(function() {
				pm.tester.setEnvironmentByName("test_oauth_env");

				pm.tester.setUrl("{{url}}");			
				pm.tester.setMethod("POST");
				var params = [
					{ key: "size", value: "original" },
					{ key: "file", value: "vacation.jpg" }
				];
				pm.tester.setBodyType("params");
				pm.tester.setFormDataParams(params);

				pm.tester.setOAuth1Params({
					"consumer_key": "{{consumer_key}}",
					"consumer_secret": "{{consumer_secret}}",
					"token": "{{token}}",
					"token_secret": "{{token_secret}}",
					"signature_method": "{{signature_method}}",
					"timestamp": "{{timestamp}}",
					"nonce": "{{nonce}}",
					"version": "{{version}}",
					"realm": "",
					"header": true,
					"auto": false
				});				

				setTimeout(function() {
					refreshed = true;
				}, 100);
			});

			waitsFor(function() {
				return refreshed === true;
			}, "Could not get response", waitTime);

			runs(function() {				
				var params = pm.tester.getFormDataParams();
				var auth = pm.tester.getHeaderValue("Authorization");
				var found = auth.search("wPkvxykrw%2BBTdCcGqKr%2B3I%2BPsiM%3D") >= 0;
				expect(found).toBe(true);

				var bodyPair = {
					"key": "size",
					"value": "original"
				};				

				expect(pm.tester.kvpairExistsInArray(params, bodyPair)).toBe(true);
			});
		});

	it("can generate oauth1.0 params for formdata post request with variables with auto add", function() {
		var responseLoaded = false;
		runs(function() {
			pm.tester.setEnvironmentByName("test_oauth_env");

			pm.tester.setUrl("http://localhost:5000/post");			
			pm.tester.setMethod("POST");
			var params = [
				{ key: "size", value: "original" },
				{ key: "file", value: "vacation.jpg" }
			];
			pm.tester.setBodyType("params");
			pm.tester.setFormDataParams(params);

			pm.tester.setOAuth1Params({
				"consumer_key": "{{consumer_key}}",
				"consumer_secret": "{{consumer_secret}}",
				"token": "{{token}}",
				"token_secret": "{{token_secret}}",
				"signature_method": "{{signature_method}}",
				"timestamp": "{{timestamp}}",
				"nonce": "{{nonce}}",
				"version": "{{version}}",
				"realm": "",
				"header": false,
				"auto": true
			});			

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
			expect(pm.tester.prettyBodyHasString("oauth_signature")).toBe(true);
		});
	});
	});	
});