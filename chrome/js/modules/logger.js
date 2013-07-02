var Logger = Backbone.Model.extend({
	defaults: function() {
		return {
			toShow: true
		};
	},

	//For debug messages
	debug: function() {
		console.log(arguments);
	},

	//For stuff that is ok to be logged in production code. For ex. error messages
	message: function() {
		console.log(arguments);
	}
});