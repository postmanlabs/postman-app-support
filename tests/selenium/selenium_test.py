from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.select import Select
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import selenium.webdriver.chrome.service as service
import inspect
import time
from pmtests.postman_tests import PostmanTests
from pmtests.postman_tests_history import PostmanTestsHistory
from pmtests.postman_tests_collections import PostmanTestsCollections
from pmtests.postman_tests_environments import PostmanTestsEnvironments
from pmtests.postman_tests_helpers import PostmanTestsHelpers
from pmtests.postman_tests_requests import PostmanTestsRequests
from pmtests.postman_tests_layout import PostmanTestsLayout

def main():
    PostmanTestsHistory().run()
    PostmanTestsCollections().run()
    PostmanTestsEnvironments().run()
    PostmanTestsHelpers().run()
    PostmanTestsRequests().run()
    PostmanTestsLayout().run()

if __name__ == "__main__":
    main()
