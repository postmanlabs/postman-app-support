pm.logger = {
	show: true,

	//For debug messages
	debug: function() {
		if (toShow) {
			console.log(arguments);	
		}		
	},

	//For stuff that is ok to be logged in production code. For ex. error messages
	message: function() {
		console.log(arguments);
	}
};