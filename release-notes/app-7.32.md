## Postman v7.32.0

### What's New
* Static IPs are enabled by default on monitors for Business and Enterprise teams. You can also view the static IP details on the Create Monitor page for easy reference.
* It’s easier to draft OpenAPI2 and OpenAPI3 schemas with new support for auto-complete.
* You can more accurately depict API behavior with mock servers by simulating a 100ms, 300ms, or custom network delay. 

### Improvements
* You can now import and configure multiple API schemas at once in Postman. 
* When inviting teammates to a workspace, we added a confirmation message to ensure any changes weren’t lost on closing the invitation window without saving.
* Updated the placeholder value for the header prefix field in OAuth2, which previously implied that “Bearer” would be added by default if left blank
[#8811](https://github.com/postmanlabs/postman-app-support/issues/8811)

### Bug Fixes
* Fixed a bug when adding empty params to the OAuth1 signature, where the signature would be calculated incorrectly
[#8737](https://github.com/postmanlabs/postman-app-support/issues/8737)
* Fixed a bug when entering a request query param with the value `hasOwnProperty` would cause the app to crash
[#8924](https://github.com/postmanlabs/postman-app-support/issues/8924)
* Fixed a bug when stopping a collection run would cause the app to crash
[#8972](https://github.com/postmanlabs/postman-app-support/issues/8972)
* Fixed a bug when changing workspaces, where newer collection runs wouldn’t sync.
* Fixed a bug when filtering the workspace activity feed by user, where the list of users wouldn’t show up in the filter menu.
