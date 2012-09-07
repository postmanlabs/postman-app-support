from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.select import Select
import selenium.webdriver.chrome.service as service
import inspect

def set_url_field(browser, val):
    url_field = browser.find_element_by_id("url")
    url_field.clear()
    url_field.send_keys(val)

def get_codemirror_value(browser):
    w = WebDriverWait(browser, 10)    
    w.until(lambda browser: browser.find_element_by_id("response").get_attribute("style").find("block") > 0)
    code_data_textarea = browser.find_element_by_css_selector("#response-as-code .CodeMirror")
    code_data_value = browser.execute_script("return arguments[0].innerHTML", code_data_textarea)
    return code_data_value

def PostmanTests:
    def __init__(self):
        s = service.Service('/Users/asthana/Documents/www/chromedriver')  # Optional argument, if not specified will search path.
        s.start()
    
        capabilities = {'chrome.switches': ["--load-extension=/Users/asthana/Documents/www/postman/POSTMan-Chrome-Extension/chrome"]}
        browser = webdriver.Remote(s.service_url, capabilities)        
        
        self.s = s
        self.browser = browser
        
        load_postman()

    def load_postman(self):
        self.browser.get('chrome-extension://ljkndjhokjnonidfaggiacifldihhjmg/index.html')

class PostmanTestsRequests(PostmanTests):
    def run(self):
        test_title()
        test_indexed_db()
        test_get_basic()
        test_delete_basic()
        test_head_basic()
        test_options_basic()
        test_post_basic()
        test_put_basic()

        self.browser.quit()

    def run_auto(self):
        methods = inspect.getmembers(self, predicate=inspect.ismethod)
        for method in methods:
            name = method[0]
            if name.find("test_") is 0:
                method = getattr(PostmanTestsRequests, name)
                method(self)

    def test_title(self):
        assert "Postman" in self.browser.title

    def test_indexed_db(self):
        w = WebDriverWait(self.browser, 10)
        w.until(lambda driver: self.browser.find_element_by_css_selector("#sidebar-section-history .empty-message"))

        print "test_indexed_db successful"
        return True

    def test_get_basic(self):
        set_url_field(self.browser, "http://httpbin.org/html")

        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()

        code_data_value = get_codemirror_value(self.browser)    

        if code_data_value.find("html") > 0:
            print "test_get_basic test successful"
            return True
        else:
            print "test_get_basic test failed"
            return False

    def test_delete_basic(self):
        set_url_field(self.browser, "http://httpbin.org/delete")

        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("DELETE")

        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()

        code_data_value = get_codemirror_value(self.browser)

        if code_data_value.find("delete") > 0:
            print "test_delete_basic content test successful"
            return True
        else:
            print "test_delete_basic content test failed"
            return False

        return True


    def test_head_basic(self):
        set_url_field(self.browser, "http://httpbin.org/html")
        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("HEAD")
        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()
        code_data_value = get_codemirror_value(self.browser)

        if code_data_value.find("div") > 0:
            print "test_head_basic content test successful"
            return True
        else:
            print "test_head_basic content test failed"
            return False

    def test_options_basic(self):
        set_url_field(self.browser, "http://httpbin.org/html")
        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("OPTIONS")
        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()
        code_data_value = get_codemirror_value(self.browser)

        if code_data_value.find("div") > 0:
            print "test_options_basic content test successful"
            return True
        else:
            print "test_options_basic content test failed"
            return False

    def test_post_basic(self):
        set_url_field(self.browser, "http://httpbin.org/post")
        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("POST")
        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()
        code_data_value = get_codemirror_value(self.browser)

        if code_data_value.find("post") > 0:
            print "test_post_basic content test successful"
            return True
        else:
            print "test_post_basic content test failed"
            return False

    def test_put_basic(self):
        set_url_field(self.browser, "http://httpbin.org/put")
        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("PUT")
        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()
        code_data_value = get_codemirror_value(self.browser)

        if code_data_value.find("put") > 0:
            print "test_put_basic content test successful"
            return True
        else:
            print "test_put_basic content test failed"
            return False

class PostmanTestsHistory:
    def __init__(self, browser):
        self.browser = browser

    def run(self):
        pass

    def test_save_request_to_history(self):
        pass
        

def main():   
    PostmanTestsRequests(browser).run()

if __name__ == "__main__":
    main()
