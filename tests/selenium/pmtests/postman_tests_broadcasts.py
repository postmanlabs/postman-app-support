from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.select import Select
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import selenium.webdriver.chrome.service as service
import inspect
import time
from postman_tests import PostmanTests

class PostmanTestsBroadcasts(PostmanTests):
    def test_1_show_broadcasts(self):
        browser = self.browser
        w = WebDriverWait(browser, 10)    
        w.until(lambda browser: browser.find_element_by_css_selector("#broadcasts-count").get_attribute("class").find("new-broadcasts") == 0)
        count = self.browser.find_element_by_css_selector("#broadcasts-count")
        count_value = self.browser.execute_script("return arguments[0].innerHTML", count)
        
        if count_value.find("2") == 0:
            return True
        else:
            return False

    def test_2_click_broadcast_link(self):
        count = self.browser.find_element_by_css_selector("#broadcasts-count")
        count.click()

        broadcasts_div = self.browser.find_element_by_css_selector("#broadcasts .dropdown-menu")
        broadcasts_value = self.browser.execute_script("return arguments[0].innerHTML", broadcasts_div)

        if broadcasts_value.find("dropdown") > 0:
            count = self.browser.find_element_by_css_selector("#broadcasts-count")
            count_value = self.browser.execute_script("return arguments[0].innerHTML", count)        
            if count_value.find("0") == 0:
                return True
            else:
                return False            
        else:
            return False

PostmanTestsBroadcasts().run()
