from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.select import Select
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import selenium.webdriver.chrome.service as service
import inspect
import time
from postman_tests import PostmanTests

class PostmanTestsHistory(PostmanTests):
    def run(self):
        print "\nTesting history"
        print "---------------"
        self.test_save_request_to_history()
        self.test_load_request_from_history()
        self.test_delete_request_from_history()
        self.test_clear_history()
        self.browser.quit()

    def test_save_request_to_history(self):
        self.set_url_field(self.browser, "http://localhost:5000/get?val=1")
        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("GET")
        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()
        code_data_value = self.get_codemirror_value(self.browser)

        if code_data_value.find("get") > 0:
            first_history_item = self.browser.find_element_by_css_selector("#history-items li:nth-of-type(1) .request")
            value = self.browser.execute_script("return arguments[0].innerHTML", first_history_item)
            if value.find("http://localhost:5000/get?val=1") > 0:
                self.print_success("test_save_request_to_history")
        else:
            self.print_failed("test_save_request_to_history")

    def test_load_request_from_history(self):
        self.set_url_field(self.browser, "")
        first_history_item = self.browser.find_element_by_css_selector("#history-items li:nth-of-type(1) .request")
        first_history_item.click()

        try:
            w = WebDriverWait(self.browser, 10)    
            w.until(lambda browser: self.browser.find_element_by_id("url").get_attribute("value") == "http://localhost:5000/html?val=1")
            self.print_success("test_load_request_from_history")
        except:
            self.print_failed("test_load_request_from_history")

    def test_delete_request_from_history(self):
        first_history_item = self.browser.find_element_by_css_selector("#history-items li:nth-of-type(1) .request-actions .request-actions-delete")
        first_history_item.click()

        history_items = self.browser.find_elements_by_css_selector("#history-items li")

        if len(history_items) == 0:
            self.print_success("test_delete_request_from_history")
        else:
            self.print_failed("test_delete_request_from_history")

    def test_clear_history(self):
        self.set_url_field(self.browser, "http://localhost:5000/html?val=1")
        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("GET")
        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()

        # Waits for the response
        self.get_codemirror_value(self.browser)

        self.set_url_field(self.browser, "http://localhost:5000/html?val=2")
        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("GET")
        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()

        # Waits for the response
        self.get_codemirror_value(self.browser)

        clear_all_button = self.browser.find_element_by_css_selector("#history-options .history-actions-delete")
        clear_all_button.click()

        history_items = self.browser.find_elements_by_css_selector("#history-items li")

        if len(history_items) == 0:
            self.print_success("test_clear_history")
        else:
            self.print_failed("test_clear_history")
