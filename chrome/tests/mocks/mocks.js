// TODO Simplify using JSMockito
function getSettingsMock() {
    var settings = {
        getSetting: function(key) {
            if (key === "variableDelimiter") {
                return "{{...}}";
            }
            else if (key === "selectedEnvironmentId") {                
                return "1";
            }
        }
    };
    
    return settings;
}

// TODO Really need a better way to mock this
function getEnvironmentsMock() {
    var environments = {
        on: function(a1, a2, a3) {

        },

        get: function(key) {            
            if (key === "1") {
                return {
                    toJSON: function() {
                        return {
                            values: [
                                {
                                    key: "env_foo",
                                    value: "env_bar"
                                }
                            ]
                        };
                    }
                };
            }            
        }
    };

    return environments;
}

function getGlobalsMock() {
    var globals = {
        get: function(key) {
            if (key === "globals") {
                return [
                    {
                        key: "foo",
                        value: "bar"
                    },
                    {
                        key: "something",
                        value: "new"
                    }
                ];
            }
        }
    };

    return globals;
}
