## Postman v7.25.0

Hello! We hope you’re staying safe and healthy. Here’s what you can find in this Postman release:

### What’s New

* This release introduces Viewer and Editor roles for environments [#6596](https://github.com/postmanlabs/postman-app-support/issues/6596)
    * Viewers can access variable values to send requests and edit the Current Value
    * Editors can add or remove variables from the environment, edit the environment name, and update  the Initial Value, which is shared with your team
* When creating or editing a monitor, you can now set how many times you’d like to retry a failed monitoring run before getting an email alert.
* It’s a bit easier to debug errors when sending a request or getting a response now that you can see the error message in the “Response” section of the Request Builder [#6205](https://github.com/postmanlabs/postman-app-support/issues/6205)

### Improvements

* We upped how much you can zoom in from 150% to 500%, so you can appreciate the beauty of every individual pixel
[#8130](https://github.com/postmanlabs/postman-app-support/issues/8130)
* OpenAPI schema validation now supports `nullable` keyword
[#8369](https://github.com/postmanlabs/postman-app-support/issues/8369)
* When importing OpenAPI schemas, users can now choose between `Tags` or `Path` as a way to create folders
[#3](https://github.com/postmanlabs/openapi-to-postman/issues/3), 
[#57](https://github.com/postmanlabs/openapi-to-postman/issues/57)
* After creating a mock server, you now have the option to copy the mock server URL and to view the mock server call logs
* You can now view your schema’s sync status by hovering over the sync icon

### Bug Fixes

* Fixed a bug in the Collection Runner, where an individual request setting was mistakenly applied to the subsequent requests
[#8293](https://github.com/postmanlabs/postman-app-support/issues/8293)
* Fixed a bug where Authorization and Content-Type headers were duplicated in generated code snippets
[#8271](https://github.com/postmanlabs/postman-app-support/issues/8271), 
[#8290](https://github.com/postmanlabs/postman-app-support/issues/8290)
* Fixed an issue where the `minItems` and `maxItems` properties from OpenAPI specifications were not handled correctly
[#193](https://github.com/postmanlabs/openapi-to-postman/issues/193)
* Fixed a bug where GraphQL schemas without an `Input Type` would fail to import
[#10](https://github.com/postmanlabs/graphql-to-postman/issues/10), 
[#8429](https://github.com/postmanlabs/postman-app-support/issues/8429)
* Fixed a bug when opening requests where code editors would automatically format the code
[#8488](https://github.com/postmanlabs/postman-app-support/issues/8488)
* Fixed a bug in the collection browser where long collection descriptions would overlap with the folders and requests
[#8503](https://github.com/postmanlabs/postman-app-support/issues/8503)
