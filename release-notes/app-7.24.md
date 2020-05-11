## Postman v7.24.0
Hello! We hope you're staying safe and healthy. Here's what you can find in this Postman release:
### What's New
* Some big changes to the API Builder that make creating and linking API elements even easier:
  * When you generate a collection, you now have the additional option to create a mock server or monitor on top of that collection. If you'd rather create a collection from scratch for a monitor or mock server, you can also do that directly from the API Builder. 
  * You can generate collections for documentation and test suites from the "Develop" and "Test" tabs that are automatically linked to your API. Previously, you could only link existing collections. 
* There's a new encryption key you can set for an added layer of security when communicating with the Interceptor extension.
* When generating OAuth2 tokens, you can now authenticate via your default browser
[#7700](https://github.com/postmanlabs/postman-app-support/issues/7700),
[#8059](https://github.com/postmanlabs/postman-app-support/issues/8059)
* You can check in real-time whether your schema is synced to your GitHub repository.
### Improvements
* We've made various improvements to the code and description editors. Markdown descriptions have better syntax highlighting support now. In pre-request and test scripts, Postman variable suggestions now show up within relevant Postman Sandbox methods.
* You can now "move" a collection or API to another workspace. When sharing it to another workspace, select the option to remove it from the current workspace.
* Added additional import configurations for OpenAPI, RAML, and GraphQL files so that you can import your data exactly how you like it
[#82](https://github.com/postmanlabs/openapi-to-postman/issues/82)
* We've also optimized the workspace switcher modal for better performance.
### Bug Fixes
* Fixed an issue when importing schemas where path-level server objects in OpenAPI definitions were not handled correctly
[#160](https://github.com/postmanlabs/openapi-to-postman/issues/160)
* Fixed an issue where validation against OpenAPI definitions containing schemas of `type: array` didn't work properly
[#8098](https://github.com/postmanlabs/postman-app-support/issues/8098)
* cURL commands that use `--data-urlencode` now import correctly
[#8292](https://github.com/postmanlabs/postman-app-support/issues/8292)
* Fixed a bug in the Console where large numbers in JSON responses were being rounded up or down, creating discrepancies between "Raw" and "Pretty" views
[#7822](https://github.com/postmanlabs/postman-app-support/issues/7822)
* Fixed a bug in the Collection Runner where changing settings in the requester builder weren't reflected in the runner window
[#7968](https://github.com/postmanlabs/postman-app-support/issues/7968)
* Fixed a bug in the Console, where it wouldn't log intermediate requests while generating OAuth2 token
[#7952](https://github.com/postmanlabs/postman-app-support/issues/7952)
* Fixed a bug with collection runs, where disabled query params weren't available in pre-request scripts
[#7686](https://github.com/postmanlabs/postman-app-support/issues/7686)
* Fixed a bug where adding a value to a query param that was previously empty would cause the params to be sent incorrectly
[#8251](https://github.com/postmanlabs/postman-app-support/issues/8251),
[#8374](https://github.com/postmanlabs/postman-app-support/issues/8374)
* Fixed an issue when importing OpenAPI definitions where reference paths containing special characters didn't resolve correctly.
* Fixed issues in the request builder around inconsistent height and text alignment with the headers.
* Fixed a bug in the Collection Runner where for some reason you could switch into a workspace you didn't belong to.
* Fixed a bug in the text editor in which the search text would overlap with the Console header.
* Fixed an issue when deleting an API where the tab title would say "Loading..." instead of "[DELETED]".
* Bugfixes in code editors
  * Fixed a bug where Postman variable suggestions did not close when clicking outside the editor.
  * Fixed a bug where function names were highlighted differently in light theme
  [#8241](https://github.com/postmanlabs/postman-app-support/issues/8241)
  * Fixed a bug where JavaScript object spread operator was detected as incorrect syntax
  [#7749](https://github.com/postmanlabs/postman-app-support/issues/7749)
  * Fixed a bug where Postman variable suggestions were shown outside of relevant Postman Sandbox methods 
  [#7481](https://github.com/postmanlabs/postman-app-support/issues/7481)
  * Fixed an issue where the code shown in the code editors was different from the one used during sending request
  [#5775](https://github.com/postmanlabs/postman-app-support/issues/5775)
  * Fixed a bug where large code triggered incorrect syntax warnings
  [#3385](https://github.com/postmanlabs/postman-app-support/issues/3385)
* Bugfixes in description editors
  * Fixed a bug where bold text in markdown was not highlighted correctly when indented
  [#4967](https://github.com/postmanlabs/postman-app-support/issues/4967)
  * Fixed a bug where Hangeul character did not render correctly
  [#7910](https://github.com/postmanlabs/postman-app-support/issues/7910)
  * Fixed a bug where shift + clicking a line above or below would not always include the active word
  [#6091](https://github.com/postmanlabs/postman-app-support/issues/6091)
  * Fixed a bug where Unicode characters broke cursor positions
  [#5309](https://github.com/postmanlabs/postman-app-support/issues/5309)
  * Fixed a bug where words with underscores were not highlighted correctly
  [#2812](https://github.com/postmanlabs/postman-app-support/issues/2812)
