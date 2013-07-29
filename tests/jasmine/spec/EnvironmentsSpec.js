var pm = {};

describe("Postman Environment models: ", function() {

  // TODO Need a spy for pm.settings.getSetting
  describe("VariableProcessor: ", function() {
    var variableProcessor;    
    var environments;    

    beforeEach(function() {      
        var settings = getSettingsMock();
        var environments = getEnvironmentsMock();
        var globals = getGlobalsMock();

        pm.settings = settings;

        variableProcessor = new VariableProcessor({
            "environments": environments,
            "globals": globals
        });
    });

    it("is defined", function() {
        expect(variableProcessor).toBeDefined();
    });

    it("returns strings without substitution", function() {        
        var val = variableProcessor.getCurrentValue("something");
        expect(val).toBe("something");
    });

    it("returns strings with substitution from globals", function() {        
        var val = variableProcessor.getCurrentValue("{{something}}");
        expect(val).toBe("new");
    });

    it("returns strings with substitution from environments", function() {        
        var val = variableProcessor.getCurrentValue("{{env_foo}}");
        expect(val).toBe("env_bar");
    });

    it("returns strings with substitution from both environments and globals", function() {        
        var val = variableProcessor.getCurrentValue("{{env_foo}}/{{something}}");
        expect(val).toBe("env_bar/new");
    });

    it("returns string as it is if invalid variable", function() {        
        var val = variableProcessor.getCurrentValue("{{env_foo_unavailable}}/{{something}}");
        expect(val).toBe("{{env_foo_unavailable}}/new");
    });
  });
  
});