## Postman v7.33.0

### What's New
* Keep up with the latest changes by “watching” an API schema! [Learn more](https://learning.postman.com/docs/designing-and-developing-your-api/the-api-workflow/#watch-an-api)
* Scan your GitHub repository and import API schemas and collections directly into your workspace! [Learn more](https://go.pstmn.io/github-import)

### Bug Fixes
* Fixed a bug when generating a collection from OpenAPI schemas, where authorization headers weren’t added in the documentation
[#7914](https://github.com/postmanlabs/postman-app-support/issues/7914)
* Fixed a bug when adding test and pre-request scripts, where some JavaScript syntax highlighting was missing
[#8463](https://github.com/postmanlabs/postman-app-support/issues/8463)
* Fixed a bug when validating collections against OpenAPI schemas where some JSON objects were not validated correctly
[#8474](https://github.com/postmanlabs/postman-app-support/issues/8474)
* Fixed a bug when viewing examples, where a large list was not scrollable
[#8906](https://github.com/postmanlabs/postman-app-support/issues/8906)
* Fixed a bug when formatting XML content, where indentation settings weren’t taken into account
[#9024](https://github.com/postmanlabs/postman-app-support/issues/9024)
* Fixed a bug where, in some cases, users would get notified for comments where they were not tagged.
