## Postman v7.35.0

### What's New
* You can now share the parameters to generate a new OAuth 2.0 token along with a request or collection when collaborating with others
[#5459](https://github.com/postmanlabs/postman-app-support/issues/5459)
* You can also now store multiple OAuth 2.0 token generation configurations in a single collection or workspace
[#4636](https://github.com/postmanlabs/postman-app-support/issues/4636),
[#7537](https://github.com/postmanlabs/postman-app-support/issues/7537)
* Your access tokens will not be shared with the collection unless specified explicitly
[#1507](https://github.com/postmanlabs/postman-app-support/issues/1507)

### Improvement
* We’ve made some performance improvements to the Manage Environment key-value editor so it’s easier to work with many variables
[#5827](https://github.com/postmanlabs/postman-app-support/issues/5827)

### Bug Fixes
* Fixed an issue where the Content-Length header was not added to HTTP code snippets
[#244](https://github.com/postmanlabs/postman-code-generators/issues/244)
* Fixed an issue where GraphQL bodies were incorrectly formatted in NodeJS code snippets
[#337](https://github.com/postmanlabs/postman-code-generators/issues/337)
* Fixed an issue where URLs in response viewer had escape character appended to them when clicked to open in a new tab or browser
[#7726](https://github.com/postmanlabs/postman-app-support/issues/7726)
* Fixed an issue where the allOf keyword was not correctly resolved while converting OpenAPI schemas to collections
[#8812](https://github.com/postmanlabs/postman-app-support/issues/8812)
* Fixed an issue where some Swagger2.0 schemas were not converted to collections
[#8457](https://github.com/postmanlabs/postman-app-support/issues/8457)
* Fixed an issue where files with non-ASCII names were not being sent properly in the form-data body
[#8537](https://github.com/postmanlabs/postman-app-support/issues/8537)
* Fixed an issue where custom proxy requests fail with the 407 status code
[#8783](https://github.com/postmanlabs/postman-app-support/issues/8783)
* Fixed an issue where the popover overlapped with the code when hovered over it in the Script Editor
[#8829](https://github.com/postmanlabs/postman-app-support/issues/8829)
* Fixed an issue where a change in the working directory was not being reflected in the UI
[#8878](https://github.com/postmanlabs/postman-app-support/issues/8878)
* Fixed an issue where the console was not logging error message for token request while generating new OAuth token.
* Fixed an issue where strings in JSON text were not highlighted consistently.
* Fixed the indentation of auto-wrapped lines in the markdown editors.
