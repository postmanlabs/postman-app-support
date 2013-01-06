from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.select import Select
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import selenium.webdriver.chrome.service as service
import inspect
import time
from postman_tests import PostmanTests

class PostmanTestsLayout(PostmanTests):
    def test_1_toggle_sidebar(self):
        sidebar_toggle = self.browser.find_element_by_id("sidebar-toggle")
        sidebar_toggle.click()
        time.sleep(1)

        sidebar = self.browser.find_element_by_id("sidebar")
        sidebar_style = sidebar.get_attribute("style")
        if sidebar_style.find("5px") < 0:
            self.print_failed("test_toggle_sidebar")
        else:
            sidebar_toggle.click()
            time.sleep(1)
            sidebar_style = sidebar.get_attribute("style")

            if sidebar_style.find("350px") > 0:
                self.print_success("test_toggle_sidebar")
            else:
                self.print_failed("test_toggle_sidebar")
