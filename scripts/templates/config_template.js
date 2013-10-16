// Constants
var POSTMAN_WEB_URL_PRODUCTION = "https://www.getpostman.com";
var POSTMAN_WEB_URL_LOCAL = "http://localhost/postman/html";

var POSTMAN_INDEXED_DB_PRODUCTION = "postman";
var POSTMAN_INDEXED_DB_TESTING = "postman_test";

// Config variables
var postman_flag_is_testing = {{ is_testing }};
var postman_web_url = {{ web_url }};

var postman_database_name;

if (postman_flag_is_testing) {
	postman_database_name = POSTMAN_INDEXED_DB_TESTING;
}
else {
	postman_database_name = POSTMAN_INDEXED_DB_PRODUCTION;
}