var VariableProcessor = Backbone.Model.extend({
    defaults: function() {
        return {
            environments: null,
            globals: null,
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
        this.set("selectedEnv", this.get("environments").get("selectedEnvironmentId"));
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
            finalString = finalString.replace(patString, values[i].value);
        }

        var globals = this.get("globals");
        count = globals.length;
        for (i = 0; i < count; i++) {
            patString = startDelimiter + globals[i].key + endDelimiter;
            pattern = new RegExp(patString, 'g');
            finalString = finalString.replace(patString, globals[i].value);
        }

        if (this.containsVariable(finalString, values)) {
            finalString = this.processString(finalString, values);
            return finalString;
        }
        else {
            return finalString;
        }
    },

    // TODO Just use one of these functions
    convertString:function (string) {
        var envModel = this.get("selectedEnv");
        var envValues = [];

        if (envModel) {
            var environment = envModel.toJSON();
            if (environment !== null) {
                envValues = environment.values;
            }
        }

        var globals = this.get("globals").get("globals");
        var values = _.union(envValues, globals);

        return this.processString(string, values);
    },

    getCurrentValue: function(string) {
        var envModel = this.get("selectedEnv");
        var envValues = [];

        if (envModel) {
            var environment = envModel.toJSON();
            if (environment !== null) {
                envValues = environment.values;
            }
        }

        var globals = this.get("globals").get("globals");
        var values = _.union(envValues, globals);

        return this.processString(string, values);
    },
});