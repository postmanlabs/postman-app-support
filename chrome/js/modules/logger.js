pm.logger = {
	toShow: true,

	//For debug messages
	debug: function() {
		if (pm.logger.toShow) {
			console.log(arguments);	
		}		
	},

	//For stuff that is ok to be logged in production code. For ex. error messages
	message: function() {
		console.log(arguments);
	}
};