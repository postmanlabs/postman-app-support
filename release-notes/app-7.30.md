## Postman v7.30.0

### What's New
* Collaborate more effectively and in greater detail now by leaving comments on specific request elements, including params, headers, body, pre-request script, and tests. [Learn More](https://learning.postman.com/docs/collaborating-in-postman/commenting-on-collections/#commenting-in-the-app)

### Improvements
* Better organize the collections and API elements (mock server, monitors, tests, and documentation) generated from API schemas by using the new advanced preferences.

### Bug Fixes
* Fixed a bug when viewing a response where response status messages with UTF-8 characters were not displayed correctly
[#3995](https://github.com/postmanlabs/postman-app-support/issues/3995)
* Fixed a bug when viewing variable suggestions, where the dropdown would cut off when it was too close to the edge of the window
[#6816](https://github.com/postmanlabs/postman-app-support/issues/6816)
* Fixed a bug when generating OAuth2 tokens where client certificates were not working
[#8825](https://github.com/postmanlabs/postman-app-support/issues/8825)
* Fixed a bug when sending a request, where you couldn’t use a raw IPv6 address
[#8847](https://github.com/postmanlabs/postman-app-support/issues/8847)
* Fixed a bug when saving a response, where the response wouldn’t save to the last chosen directory
[#8864](https://github.com/postmanlabs/postman-app-support/issues/8864)
