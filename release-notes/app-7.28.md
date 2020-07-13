## Postman v7.28.0

Hello! We hope you’re staying safe and healthy. Here’s what you can find in this Postman release:

### Improvements

* We've made several improvements to the request authoring experience by making the app easier to navigate and customize
[#7035](https://github.com/postmanlabs/postman-app-support/issues/7035),
[#5903](https://github.com/postmanlabs/postman-app-support/issues/5903):
    * You can now drag the request and response panes, the sidebar, and the Find and Replace pane to resize and collapse them.
    * We have also removed the top-level scroll to fix the scroll-within-a-scroll issue.
* We have also improved the debugging experience by showing Console data directly in the app:
    * When inspecting a response, you can now view the pre-request scripts, tests, and request logs by selecting the `Console` button on the app footer.
    * You can also access the same Console pane from the Collection Runner, allowing you to get right to debugging all your runs without a moment's delay.
* When sending requests, the “Use next generation URL processing” setting will be enabled by default. Learn more about this [URL processing system](https://github.com/postmanlabs/postman-app-support/issues/8154).
* You can now join any workspace you don’t already belong to directly from the workspace switcher.

### Bug Fixes

* Fixed an issue when editing a JSON request body where Postman variables with escaped characters would not be highlighted correctly
[#8616](https://github.com/postmanlabs/postman-app-support/issues/8616)
* Fixed an issue when editing a GraphQL request body where the String type was incorrectly highlighted as `missing` type
[#8567](https://github.com/postmanlabs/postman-app-support/issues/8657)
* Fixed a bug when uploading a profile picture with a transparent background, where the stock picture would still be visible behind the user’s picture
[#8577](https://github.com/postmanlabs/postman-app-support/issues/8577)
* Fixed an issue where importing schemas via links wasn’t working
[#8686](https://github.com/postmanlabs/postman-app-support/issues/8686)
* Fixed an issue where code snippets for cURL, Java, NodeJS, Python, and Swift didn’t have correctly escaped single quotes in the URL
[#8674](https://github.com/postmanlabs/postman-app-support/issues/8674)
