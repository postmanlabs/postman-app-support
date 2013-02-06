pm.jsonlint = {
    instance: null,
    
    init: function() {
      pm.jsonlint.instance = jsonlint_postman;
      jsonlint_postman = null;
    }
};
