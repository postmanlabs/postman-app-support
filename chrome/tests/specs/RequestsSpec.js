describe("Postman can send requests", function() {
	describe("GET requests", function() {
		it("can click Send", function() {
			runs(function() {
				$("#submit-request").click();
			});
		});
	});	
});