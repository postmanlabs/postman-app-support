from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.select import Select
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
        w.until(lambda browser: browser.find_element_by_id("response").get_attribute("style").find("block") > 0)
        code_data_textarea = browser.find_element_by_css_selector("#response-as-code .CodeMirror")
        code_data_value = browser.execute_script("return arguments[0].innerHTML", code_data_textarea)
        return code_data_value

    def test_title(self):
        assert "Postman" in self.browser.title

    def test_indexed_db(self):
        w = WebDriverWait(self.browser, 10)
        w.until(lambda driver: self.browser.find_element_by_css_selector("#sidebar-section-history .empty-message"))

        print "\nPostman loaded succesfully. IndexedDB opened"
        return True

    def print_success(self, method_name):
        print "[PASSED] %s" % method_name

    def print_failed(self, method_name):
        print "[FAILED] %s" % method_name

class PostmanTestsRequests(PostmanTests):
    def run(self):
        print "\nTesting requests"
        print "---------------"
        self.test_get_basic()
        self.test_delete_basic()
        self.test_head_basic()
        self.test_options_basic()
        self.test_post_basic()
        self.test_put_basic()

        self.browser.quit()
        print "---------------"

    def run_auto(self):
        methods = inspect.getmembers(self, predicate=inspect.ismethod)
        for method in methods:
            name = method[0]
            if name.find("test_") is 0:
                method = getattr(PostmanTestsRequests, name)
                method(self)

    def test_get_basic(self):
        self.set_url_field(self.browser, "http://httpbin.org/html")

        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()

        code_data_value = self.get_codemirror_value(self.browser)    

        if code_data_value.find("html") > 0:
            self.print_success("test_get_basic")
            return True
        else:
            self.print_failed("test_get_basic")
            return False

    def test_delete_basic(self):
        self.set_url_field(self.browser, "http://httpbin.org/delete")

        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("DELETE")

        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()

        code_data_value = self.get_codemirror_value(self.browser)

        if code_data_value.find("delete") > 0:
            self.print_success("test_delete_basic")
            return True
        else:
            self.print_failed("test_delete_basic")
            return False

        return True


    def test_head_basic(self):
        self.set_url_field(self.browser, "http://httpbin.org/html")
        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("HEAD")
        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()
        code_data_value = self.get_codemirror_value(self.browser)

        if code_data_value.find("div") > 0:
            self.print_success("test_head_basic")
            return True
        else:
            self.print_failed("test_head_basic")
            return False

    def test_options_basic(self):
        self.set_url_field(self.browser, "http://httpbin.org/html")
        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("OPTIONS")
        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()
        code_data_value = self.get_codemirror_value(self.browser)

        if code_data_value.find("div") > 0:
            self.print_success("test_options_basic")
            return True
        
            self.print_failed("test_options_basic")
            return False

    def test_post_basic(self):
        self.set_url_field(self.browser, "http://httpbin.org/post")
        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("POST")
        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()
        code_data_value = self.get_codemirror_value(self.browser)

        if code_data_value.find("post") > 0:
            self.print_success("test_post_basic")
            return True
        else:
            self.print_failed("test_post_basic")
            return False

    def test_put_basic(self):
        self.set_url_field(self.browser, "http://httpbin.org/put")
        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("PUT")
        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()
        code_data_value = self.get_codemirror_value(self.browser)

        if code_data_value.find("put") > 0:
            self.print_success("test_put_basic")
            return True
        else:
            self.print_failed("test_put_basic")
            return False

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
        self.set_url_field(self.browser, "http://httpbin.org/html?val=1")
        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("GET")
        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()
        code_data_value = self.get_codemirror_value(self.browser)

        if code_data_value.find("html") > 0:
            first_history_item = self.browser.find_element_by_css_selector("#history-items li:nth-of-type(1) .request")
            value = self.browser.execute_script("return arguments[0].innerHTML", first_history_item)
            if value.find("http://httpbin.org/html?val=1") > 0:
                self.print_success("test_save_request_to_history")
        else:
            self.print_failed("test_save_request_to_history")

    def test_load_request_from_history(self):
        self.set_url_field(self.browser, "")
        first_history_item = self.browser.find_element_by_css_selector("#history-items li:nth-of-type(1) .request")
        first_history_item.click()

        try:
            w = WebDriverWait(self.browser, 10)    
            w.until(lambda browser: self.browser.find_element_by_id("url").get_attribute("value") == "http://httpbin.org/html?val=1")
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
        self.set_url_field(self.browser, "http://httpbin.org/html?val=1")
        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("GET")
        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()

        # Waits for the response
        self.get_codemirror_value(self.browser)

        self.set_url_field(self.browser, "http://httpbin.org/html?val=2")
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
        
class PostmanTestsLayout(PostmanTests):
    def run(self):
        print "\nTesting layout"
        print "---------------"
        self.test_toggle_sidebar()
        self.test_make_postman_better_modal()
        self.browser.quit()

    def test_toggle_sidebar(self):
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


    def test_make_postman_better_modal(self):
        sidebar_footer = self.browser.find_element_by_id("sidebar-footer")
        sidebar_footer.click()
        time.sleep(0.5)

        modal = self.browser.find_element_by_id("modal-spread-the-word")
        style = modal.get_attribute("style")
        if style.find("block") > 0:
            self.print_success("test_make_postman_better_modal")
        else:
            self.print_failed("test_make_postman_better_modal")

        
    
def main():
    # PostmanTestsRequests().run()
    # PostmanTestsHistory().run()
    PostmanTestsLayout().run()

if __name__ == "__main__":
    main()
