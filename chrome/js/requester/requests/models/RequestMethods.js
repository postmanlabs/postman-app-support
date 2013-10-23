var RequestMethods = Backbone.Model.extend({
    defaults: function() {
    	var defaultMethods = [
    		{"verb": "GET", "hasBody": false},
    		{"verb": "POST", "hasBody": true},
    		{"verb": "PUT", "hasBody": true},
    		{"verb": "PATCH", "hasBody": true},
    		{"verb": "DELETE", "hasBody": true},
    		{"verb": "COPY", "hasBody": false},
    		{"verb": "HEAD", "hasBody": false},
    		{"verb": "OPTIONS", "hasBody": false},
    		{"verb": "LINK", "hasBody": true},
    		{"verb": "UNLINK", "hasBody": true},
    		{"verb": "PURGE", "hasBody": false}
    	];

        return {
            methods: defaultMethods
        };
    },

    initialize: function(callback) {
    	var model = this;

    	pm.storage.getValue("requestMethods", function(requestMethods) {
    		if (requestMethods !== null) {
    			// model.set("methods", requestMethods);

    			if (callback) {
    				callback();
    			}
    		}
    		else {
    			var o = {"requestMethods": model.get("methods")};
    			pm.storage.setValue(o, function() {
    				if (callback) {
    					callback();
    				}
    			});
    		}

    	});
	},

    isMethodWithBody: function(verb) {
    	var methods = this.get("methods");
    	var index = arrayObjectIndexOf(methods, verb, "verb");

    	if (index >= 0) {
    		return methods[index].hasBody;
    	}
    	else {
    		return false;
    	}
    },

    saveMethods: function() {
    	var o = {"requestMethods": this.get("methods")};
    	pm.storage.setValue(o, function() {
    		if (callback) {
    			callback();
    		}
    	});
    },

    addMethod: function(method) {
    	var index = arrayObjectIndexOf(this.get("methods"), method.verb, "verb");
    	if (index === -1) {
    		this.get("methods").push(method);
    		this.saveMethods();
    	}
    },

    updateMethod: function(method) {
    	var index = arrayObjectIndexOf(this.get("methods"), method.verb, "verb");
    	if (index >= 0) {
    		var methods = this.get("methods");
    		methods[index] = method;
    		this.set("methods", methods);
    		this.saveMethods();
    	}
    },

    deleteMethod: function(verb) {
    	var index = arrayObjectIndexOf(this.get("methods"), method.verb, "verb");
    	if (index >= 0) {
    		var methods = this.get("methods");
    		methods.splice(index, 1);
    		this.set("methods", methods);
    		this.saveMethods();
    	}
    }
});