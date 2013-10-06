var VariableProcessor = Backbone.Model.extend({
    defaults: function() {
        return {
            environments: null,
            globals: null,
            functions: {},
            selectedEnv:null,
            selectedEnvironmentId:""
        };
    },

    initialize: function() {
        this.get("environments").on("reset", this.setCurrentEnvironment, this);
        this.get("environments").on("change", this.setCurrentEnvironment, this);
        this.get("environments").on("add", this.setCurrentEnvironment, this);
        this.get("environments").on("remove", this.setCurrentEnvironment, this);

        this.set("selectedEnvironmentId", pm.settings.getSetting("selectedEnvironmentId"));
        this.set("selectedEnv", this.get("environments").get(pm.settings.getSetting("selectedEnvironmentId")));

        this.initializeFunctions();
    },

    initializeFunctions: function() {
        var functions = {
            "$guid": {
                run: function() {
                    return guid();
                }
            },

            "$timestamp": {
                run: function() {
                    return Math.round(new Date().getTime() / 1000);
                }
            },

            "$randomInt": {
                run: function(min, max) {
                    if (!min) min = 0;
                    if (!max) max = 1000;
                    return getRandomInt(min, max);
                }
            },

            "\\$random [0-9]+,[0-9]+": {
                run: function(min, max) {
                    if (!min) min = 0;
                    if (!max) max = 1000;

                    return getRandomArbitrary(min, max);
                }
            }
        };

        this.set("functions", functions);
    },

    setCurrentEnvironment: function() {
        this.set("selectedEnvironmentId", pm.settings.getSetting("selectedEnvironmentId"));
        this.set("selectedEnv", this.get("environments").get(pm.settings.getSetting("selectedEnvironmentId")));
    },

    containsVariable:function (string, values) {
        var variableDelimiter = pm.settings.getSetting("variableDelimiter");
        var startDelimiter = variableDelimiter.substring(0, 2);
        var endDelimiter = variableDelimiter.substring(variableDelimiter.length - 2);
        var patString = startDelimiter + "[^\r\n]*" + endDelimiter;
        var pattern = new RegExp(patString, 'g');
        var matches = string.match(pattern);
        var count = values.length;
        var variable;

        if(matches === null) {
            return false;
        }

        for(var i = 0; i < count; i++) {
            variable = startDelimiter + values[i].key + endDelimiter;
            if(_.indexOf(matches, variable) >= 0) {
                return true;
            }
        }

        return false;
    },

    processString:function (string, values) {
        if (!values) return string;

        var count = values.length;
        var finalString = string;
        var patString;
        var pattern;

        var variableDelimiter = pm.settings.getSetting("variableDelimiter");
        var startDelimiter = variableDelimiter.substring(0, 2);
        var endDelimiter = variableDelimiter.substring(variableDelimiter.length - 2);

        for (var i = 0; i < count; i++) {
            patString = startDelimiter + values[i].key + endDelimiter;
            pattern = new RegExp(patString, 'g');

            if(typeof values[i].value === "object") {
                var result = values[i].value.run();
                finalString = finalString.replace(patString, result);
            }
            else {
                finalString = finalString.replace(patString, values[i].value);
            }

        }

        if (this.containsVariable(finalString, values)) {
            finalString = this.processString(finalString, values);
            return finalString;
        }
        else {
            return finalString;
        }
    },

    getCurrentValue: function(string) {
        if (typeof string === "number") {
            return string;
        }

        var envModel = this.get("selectedEnv");
        var envValues = [];

        if (envModel) {
            var environment = envModel.toJSON();
            if (environment !== null) {
                envValues = environment.values;
            }
        }

        var globals = this.get("globals").get("globals");
        var values;

        if (globals) {
            values = _.union(envValues, globals);
        }

        var functions = this.get("functions");
        var fs = [];
        for(f in functions) {
            if(functions.hasOwnProperty(f)) {
                var kvpair = {
                    "key": f,
                    "value": functions[f]
                };

                fs.push(kvpair);
            }
        }

        values = _.union(values, fs);

        if (string) {
            return this.processString(string, values);
        }
        else {
            return string;
        }

    },
});