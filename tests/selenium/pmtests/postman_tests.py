from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.select import Select
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import selenium.webdriver.chrome.service as service
import inspect
import time

class PostmanTests:
    def __init__(self):
        s = service.Service('/Users/asthana/Documents/www/chromedriver')  # Optional argument, if not specified will search path.
        s.start()
    
        capabilities = {'chrome.switches': ["--load-extension=/Users/asthana/Documents/www/postman/POSTMan-Chrome-Extension/chrome"]}
        browser = webdriver.Remote(s.service_url, capabilities)        
        
        self.s = s
        self.browser = browser
        
        self.load_postman()
        self.test_title()
        self.test_indexed_db()
        

    def load_postman(self):
        self.browser.get('chrome-extension://ljkndjhokjnonidfaggiacifldihhjmg/index.html')

    def set_url_field(self, browser, val):
        url_field = browser.find_element_by_id("url")
        url_field.clear()
        url_field.send_keys(val)

    def get_codemirror_value(self, browser):
        w = WebDriverWait(browser, 10)    
        w.until(lambda browser: browser.find_element_by_css_selector("#response-success-container").get_attribute("style").find("block") > 0)
        code_data_textarea = browser.find_element_by_css_selector("#response-as-code .CodeMirror")
        code_data_value = browser.execute_script("return arguments[0].innerHTML", code_data_textarea)
        return code_data_value

    def set_code_mirror_raw_value(self, value):
        code_data_value = self.browser.execute_script("return pm.request.body.loadRawData(arguments[0])", value)
        
    def test_title(self):
        assert "Postman" in self.browser.title

    def test_indexed_db(self):
        w = WebDriverWait(self.browser, 10)
        w.until(lambda driver: self.browser.find_element_by_css_selector("#sidebar-section-history .empty-message"))

        print "\nPostman loaded succesfully. IndexedDB opened"
        return True

    def reset_request(self):
        reset_button = self.browser.find_element_by_id("request-actions-reset")
        reset_button.click()
        time.sleep(0.5)


    def print_success(self, method_name):
        print "[PASSED] %s" % method_name

    def print_failed(self, method_name):
        print "[FAILED] %s" % method_name
