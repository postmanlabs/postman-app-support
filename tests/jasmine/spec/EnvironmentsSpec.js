var pm = {};

describe("Postman Environment models", function() {

  // TODO Need a spy for pm.settings.getSetting
  describe("VariableProcessor", function() {
    var variableProcessor;    
    var environments;    

    beforeEach(function() {      
      settings = {
        getSetting: function(value) {
          return value;
        }
      };
      
      environments = {
       on: function() {
       },

       get: function() {

       }
      };

      spyOn(environments, 'on');
      spyOn(environments, 'get');
      spyOn(settings, 'getSetting');

      pm.settings = settings;

      variableProcessor = new VariableProcessor({
        "environments": environments
      });
    });

    it("is defined", function() {
      expect(variableProcessor).toBeDefined();
    });
  });
  
});