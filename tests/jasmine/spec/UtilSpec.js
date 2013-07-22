describe("Postman utility functions", function() {

  beforeEach(function() {
  });

  describe("getUrlVars", function() {
    it("should split URL with no arguments", function() {    
      var url = "http://localhost/?";
      var vars = getUrlVars(url);
      expect(vars.length).toBe(0);
    });

    it("should split URL with ?=", function() {    
      var url = "http://localhost/?=";
      var vars = getUrlVars(url);
      expect(vars.length).toBe(1);
    });

    it("should split URL with 1 argument", function() {    
      var url = "http://localhost/?foo=bar";
      var vars = getUrlVars(url);
      expect(vars.length).toBe(1);
    });

    it("should split URL with multiple arguments into key/val pairs", function() {    
      var url = "http://localhost/?foo=bar&test=blah";
      var vars = getUrlVars(url);
      expect(vars.length).toBe(2);
    });
  });

  describe("ensureProperUrl", function() {
    it("should ensure proper URL with HTTP", function() {
      var url = ensureProperUrl("http://www.google.com");
      expect(url).toBe("http://www.google.com");

      url = ensureProperUrl("http://www.google.com");
      expect(url).toBe("http://www.google.com");
    });

    it("should ensure proper URL with HTTPS", function() {
      var url = ensureProperUrl("https://www.google.com");
      expect(url).toBe("https://www.google.com");

      url = ensureProperUrl("http://www.google.com");
      expect(url).toBe("http://www.google.com");
    });

    it("should ensure proper URL with no HTTP/HTTPS", function() {
      var url = ensureProperUrl("www.google.com");
      expect(url).toBe("http://www.google.com");

      url = ensureProperUrl("http://www.google.com");
      expect(url).toBe("http://www.google.com");
    });
  });

  describe("sortAlphabetical", function() {
    it("should sort an array of objects with names alphabetically", function() {
      var a = [
        { name: "blah" }, { name: "cow" }, { name: "alice" }
      ];

      var sorted = a.sort(sortAlphabetical);
      expect(sorted[0].name).toBe("alice");
      expect(sorted[1].name).toBe("blah");
      expect(sorted[2].name).toBe("cow");
    });
  });
  
  it("should return body vars", function() {

  });

  it("should break up headers", function() {

  });

  it("should return index of object in an array according to property", function() {

  });
});
