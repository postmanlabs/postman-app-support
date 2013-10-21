describe("Postman utility functions", function() {

  beforeEach(function() {
  });

  describe("getURLPathVariables", function() {
    it("should return an empty array for null URL", function() {
        var url;
        var vars = getURLPathVariables(url);
        expect(vars.length).toBe(0);
    });

    it("should return an empty array for URL with no segments", function() {
        var url = "http://localhost/";
        var vars = getURLPathVariables(url);
        expect(vars.length).toBe(0);
    });

    it("should return an empty array for URL with no segments and a port", function() {
        var url = "http://localhost:5000/";
        var vars = getURLPathVariables(url);
        expect(vars.length).toBe(0);
    });

    it("should return an empty array for URL with no segments and url params", function() {
        var url = "http://localhost:5000/?foo=bar&something=wow";
        var vars = getURLPathVariables(url);
        expect(vars.length).toBe(0);
    });

    it("should return an empty array for URL with no segments and url params which have a colon", function() {
        var url = "http://localhost:5000/?foo=bar&something=wow:awesome:stuff:is:happening";
        var vars = getURLPathVariables(url);
        expect(vars.length).toBe(0);
    });

    it("should return key/val pairs for one path variable ending at the string end", function() {
        var url = "http://localhost/:user_id";
        var vars = getURLPathVariables(url);
        expect(vars.length).toBe(1);
    });

    it("should return key/val pairs for two path variables with one ending at the string end", function() {
        var url = "http://localhost/:user_id/:category";
        var vars = getURLPathVariables(url);
        expect(vars.length).toBe(2);
    });

    it("should return key/val pairs for path variable ending with /", function() {
        var url = "http://localhost/:user_id/";
        var vars = getURLPathVariables(url);
        expect(vars.length).toBe(1);
    });

    it("should return key/val pairs for two path variables with one ending with /", function() {
        var url = "http://localhost/:user_id/:category/";
        var vars = getURLPathVariables(url);
        expect(vars.length).toBe(2);
    });
  });

describe("replaceURLPathVariables", function() {
  it("should return an empty array for URL with no segments", function() {
      var url = "http://localhost/";
      var replacedUrl = replaceURLPathVariables(url, []);
      expect(replacedUrl).toBe(url);
  });

  it("should return an empty array for URL with no segments and a port", function() {
      var url = "http://localhost:5000/";
      var replacedUrl = replaceURLPathVariables(url, []);
      expect(replacedUrl).toBe(url);
  });

  it("should return an empty array for URL with no segments and url params", function() {
      var url = "http://localhost:5000/?foo=bar&something=wow";
      var replacedUrl = replaceURLPathVariables(url, []);
      expect(url).toBe(url);
  });

  it("should return an empty array for URL with no segments and url params which have a colon", function() {
      var url = "http://localhost:5000/?foo=bar&something=wow:awesome:stuff:is:happening";
      var replacedUrl = replaceURLPathVariables(url, []);
      expect(replacedUrl).toBe(url);
  });

  it("should return key/val pairs for one path variable ending at the string end", function() {
      var url = "http://localhost/:user_id";
      var vals = {
        "user_id": 1002
      };

      var replacedUrl = replaceURLPathVariables(url, vals);
      expect(replacedUrl).toBe("http://localhost/1002");
  });

  it("should return key/val pairs for two path variables with one ending at the string end", function() {
      var url = "http://localhost/:user_id/:category";

      var vals = {
        "user_id": 1002,
        "category": "photos"
      };

      var replacedUrl = replaceURLPathVariables(url, vals);

      expect(replacedUrl).toBe("http://localhost/1002/photos");
  });

  it("should return key/val pairs for path variable ending with /", function() {
      var url = "http://localhost/:user_id/";
      var vals = {
        "user_id": 1002
      };

      var replacedUrl = replaceURLPathVariables(url, vals);
      expect(replacedUrl).toBe("http://localhost/1002/");
  });

  it("should return key/val pairs for two path variables with one ending with /", function() {
      var url = "http://localhost/:user_id/:category/";
      var vals = {
        "user_id": 1002,
        "category": "photos"
      };

      var replacedUrl = replaceURLPathVariables(url, vals);

      expect(replacedUrl).toBe("http://localhost/1002/photos/");
  });
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

    // #130: Key and value modified if value contains ?xxxx=
    // https://github.com/a85/POSTMan-Chrome-Extension/issues/130
    it("should not split values with ?", function() {
      var url = 'http://localhost/?foo=bar&test=<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
      var vars = getUrlVars(url);
      expect(vars.length).toBe(2);
    });

    // #174: Semicolon not working in URL
    // https://github.com/a85/POSTMan-Chrome-Extension/issues/174?source=cc
    it("should not split values with ;", function() {
     var url = 'http://www.example.com/path;jsessionid=abc';
     var vars = getUrlVars(url);
     expect(vars.length).toBe(0);
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

  describe("getBodyVars", function() {
    it("should return body with single variable", function() {
      var body = "foo=bar";
      var vars = getBodyVars(body);
      expect(vars.length).toBe(1);
    });

    it("should split body with multiple variables", function() {
      var body = "foo=bar&test=blah";
      var vars = getBodyVars(body);
      expect(vars.length).toBe(2);
    });

    it("should split body with nothing", function() {
      var body = "foo";
      var vars = getBodyVars(body);
      expect(vars.length).toBe(0);

      body = "";
      vars = getBodyVars(body);
      expect(vars.length).toBe(0);
    });
  });

  describe("getHeaderVars", function() {
    it("should break up headers into key/val pairs", function() {
      var data = "Access-Control-Allow-Origin: chrome-extension://aglpidefogoeiamaehklpfoafichfmdk\n";
      data += "Content-Length: 870\n";
      data += "Content-Type: application/json\n";
      data += "Date: Tue, 23 Jul 2013 10:34:32 GMT";

      headers = getHeaderVars(data);

      expect(headers).toBeDefined();
      expect(headers.length).toBe(4);
      expect(headers[0].key).toBe("Access-Control-Allow-Origin");
      expect(headers[1].key).toBe("Content-Length");
      expect(headers[1].value).toBe("870");
      expect(headers[2].value).toBe("application/json");
    });
  });

  describe("arrayObjectIndexOf", function() {
    it("should return index of object in an array according to a property", function() {
      var a = [
        { "id": 1, "name": "Abc" },
        { "id": 2, "name": "def" },
        { "id": 3, "name": "xyz" }
      ];

      var index = arrayObjectIndexOf(a, 1, "id");
      expect(index).toBe(0);

      index = arrayObjectIndexOf(a, "def", "name");
      expect(index).toBe(1);
    });
  });
});