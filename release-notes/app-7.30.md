## Postman v7.30.0

### What's New
* You can now leave comments on specific request elements, including params, headers, body, pre-request script, and tests. [Learn More](https://learning.postman.com/docs/collaborating-in-postman/commenting-on-collections/#commenting-in-the-app).

### Improvements
* We've added configuration options when generating collections from a schema in the API Builder.
* We've added configuration options when creating API elements (like mock servers, monitors, tests, and documentation) in the API Builder.

### Bug Fixes
* Fixed a bug where response status message with UTF-8 characters was not displayed correctly
[#3995](https://github.com/postmanlabs/postman-app-support/issues/3995)
* Fixed a bug where the variable suggestions dropdown was cut off when it was too close to the edge of the window
[#6816](https://github.com/postmanlabs/postman-app-support/issues/6816)
* Fixed a bug where client certificates were not working while generating OAuth2 token
[#8825](https://github.com/postmanlabs/postman-app-support/issues/8825)
* Fixed a bug where IPv6 requests didn't work with the next-generation URL processor
[#8847](https://github.com/postmanlabs/postman-app-support/issues/8847)
* Fixed a bug where saving a response was not persisting the last chosen directory
[#8864](https://github.com/postmanlabs/postman-app-support/issues/8864)
