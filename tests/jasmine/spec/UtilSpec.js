describe("Postman utility functions", function() {

  beforeEach(function() {
  });

  it("should ensure proper URL", function() {
    var url = ensureProperUrl("www.google.com");
    expect(url).toBe("http://www.google.com");

    url = ensureProperUrl("http://www.google.com");
    expect(url).toBe("http://www.google.com");
  });

  it("should split URL into key/val pairs", function() {    
    var url = "http://localhost/?foo=bar&test=blah";
    var vars = getUrlVars(url);
    expect(vars.length).toBe(2);
  });

  it("should split URL into associative array", function() {
  });

  it("should split header into key/val pairs", function() {
  });

});
