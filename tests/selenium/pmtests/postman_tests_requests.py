from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.select import Select
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import selenium.webdriver.chrome.service as service
import inspect
import time
from postman_tests import PostmanTests

class PostmanTestsRequests(PostmanTests):
    def run(self):
        print "\nTesting requests"
        print "---------------"
        self.test_get_basic()
        self.test_get_only_key()
        self.test_delete_basic()
        self.test_head_basic()
        self.test_options_basic()
        self.test_post_basic()
        self.test_put_basic()

        self.init_environment()
        
        self.test_get_environment()
        self.test_post_formdata_environment()
        self.test_post_urlencoded_environment()
        self.test_post_raw_environment()
        self.test_post_raw_json_environment()

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
        self.reset_request()

        self.set_url_field(self.browser, "http://localhost:5000/get")

        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()

        code_data_value = self.get_codemirror_value(self.browser)    

        if code_data_value.find("get") > 0:
            self.print_success("test_get_basic")
            return True
        else:
            self.print_failed("test_get_basic")
            return False

    def test_get_only_key(self):
        self.reset_request()

        self.set_url_field(self.browser, "http://localhost:5000/get?start")

        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()

        code_data_value = self.get_codemirror_value(self.browser)    

        if code_data_value.find("/get?start") > 0:
            self.print_success("test_get_only_key")
            return True
        else:
            self.print_failed("test_get_only_key")
            return False

    def test_delete_basic(self):
        self.reset_request()

        self.set_url_field(self.browser, "http://localhost:5000/delete")

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
        self.reset_request()

        self.set_url_field(self.browser, "http://localhost:5000/html")
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
        self.reset_request()

        self.set_url_field(self.browser, "http://localhost:5000/html")
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
        self.reset_request()

        self.set_url_field(self.browser, "http://localhost:5000/post")
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
        self.reset_request()

        self.set_url_field(self.browser, "http://localhost:5000/put")
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

    def init_environment(self):
        environment_selector = self.browser.find_element_by_id("environment-selector")
        environment_selector.click()

        time.sleep(0.1)

        manage_env_link = self.browser.find_element_by_css_selector("#environment-selector .dropdown-menu li:last-child a")
        manage_env_link.click()

        time.sleep(1)

        add_env_button = self.browser.find_element_by_css_selector("#environments-list-wrapper .toolbar .environments-actions-add")
        add_env_button.click()
        time.sleep(0.3)

        environment_name = self.browser.find_element_by_id("environment-editor-name")
        environment_name.clear()
        environment_name.send_keys("Requests environment")

        first_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-key")
        first_key.clear()
        first_key.send_keys("path_get")

        first_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-value")
        first_val.clear()
        first_val.send_keys("get?start=something")

        second_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-key")
        second_key.clear()
        second_key.send_keys("path_post")

        second_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-value")
        second_val.clear()
        second_val.send_keys("post")

        third_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(3) .keyvalueeditor-key")
        third_key.clear()
        third_key.send_keys("Foo")

        third_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(3) .keyvalueeditor-value")
        third_val.clear()
        third_val.send_keys("Bar")

        fourth_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(4) .keyvalueeditor-key")
        fourth_key.clear()
        fourth_key.send_keys("Name")

        fourth_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(4) .keyvalueeditor-value")
        fourth_val.clear()
        fourth_val.send_keys("John Appleseed")

        fifth_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(5) .keyvalueeditor-key")
        fifth_key.clear()
        fifth_key.send_keys("nonce")

        fifth_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(5) .keyvalueeditor-value")
        fifth_val.clear()
        fifth_val.send_keys("kllo9940pd9333jh")

        sixth_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(6) .keyvalueeditor-key")
        sixth_key.clear()
        sixth_key.send_keys("timestamp")

        sixth_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(6) .keyvalueeditor-value")
        sixth_val.clear()
        sixth_val.send_keys("1191242096")

        seventh_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(7) .keyvalueeditor-key")
        seventh_key.clear()
        seventh_key.send_keys("url")

        seventh_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(7) .keyvalueeditor-value")
        seventh_val.clear()
        seventh_val.send_keys("http://photos.example.net/photos")

        eigth_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(8) .keyvalueeditor-key")
        eigth_key.clear()
        eigth_key.send_keys("file")

        eigth_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(8) .keyvalueeditor-value")
        eigth_val.clear()
        eigth_val.send_keys("vacation.jpg")

        ninth_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(9) .keyvalueeditor-key")
        ninth_key.clear()
        ninth_key.send_keys("size")

        ninth_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(9) .keyvalueeditor-value")
        ninth_val.clear()
        ninth_val.send_keys("original")

        submit_button = self.browser.find_element_by_css_selector("#modal-environments .environments-actions-add-submit")
        submit_button.click()
        time.sleep(0.3)

        close_button = self.browser.find_element_by_css_selector("#modal-environments .modal-header .close")
        close_button.click()

        time.sleep(1)

        environment_selector = self.browser.find_element_by_id("environment-selector")
        environment_selector.click()

        # Select the environment
        manage_env_link = self.browser.find_element_by_css_selector("#environment-selector .dropdown-menu li:nth-of-type(1) a")
        manage_env_link.click()

    def test_get_environment(self):
        self.reset_request()

        self.set_url_field(self.browser, "http://localhost:5000/{{path_get}}")

        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()

        code_data_value = self.get_codemirror_value(self.browser)    

        if code_data_value.find("get?start=something") > 0:
            self.print_success("test_get_environment")
            return True
        else:
            self.print_failed("test_get_environment")
            return False

    def test_post_formdata_environment(self):
        self.reset_request()

        self.set_url_field(self.browser, "http://localhost:5000/{{path_post}}")

        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("POST")

        first_formdata_key = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-key")
        first_formdata_key.clear()
        first_formdata_key.send_keys("size")

        first_formdata_value = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-value")
        first_formdata_value.clear()
        first_formdata_value.send_keys("{{size}}")

        second_formdata_key = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-key")
        second_formdata_key.clear()
        second_formdata_key.send_keys("file")

        second_formdata_value = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-value")
        second_formdata_value.clear()
        second_formdata_value.send_keys("{{file}}")

        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()

        code_data_value = self.get_codemirror_value(self.browser)    

        if code_data_value.find("original") > 0:
            self.print_success("test_post_formdata_environment")
            return True
        else:
            self.print_failed("test_post_formdata_environment")
            return False

    def test_post_urlencoded_environment(self):
        self.reset_request()

        self.set_url_field(self.browser, "http://localhost:5000/{{path_post}}")

        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("POST")

        # Select urlencoded
        self.browser.find_element_by_css_selector("#data-mode-selector a:nth-of-type(2)").click()

        first_formdata_key = self.browser.find_element_by_css_selector("#urlencoded-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-key")
        first_formdata_key.clear()
        first_formdata_key.send_keys("size")

        first_formdata_value = self.browser.find_element_by_css_selector("#urlencoded-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-value")
        first_formdata_value.clear()
        first_formdata_value.send_keys("{{size}}")

        second_formdata_key = self.browser.find_element_by_css_selector("#urlencoded-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-key")
        second_formdata_key.clear()
        second_formdata_key.send_keys("file")

        second_formdata_value = self.browser.find_element_by_css_selector("#urlencoded-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-value")
        second_formdata_value.clear()
        second_formdata_value.send_keys("{{file}}")

        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()

        code_data_value = self.get_codemirror_value(self.browser)    

        if code_data_value.find("original") > 0:
            self.print_success("test_post_urlencoded_environment")
            return True
        else:
            self.print_failed("test_post_urlencoded_environment")
            return False


    def test_post_raw_environment(self):
        self.reset_request()

        self.set_url_field(self.browser, "http://localhost:5000/{{path_post}}")

        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("POST")

        # Select urlencoded
        self.browser.find_element_by_css_selector("#data-mode-selector a:nth-of-type(3)").click()

        self.set_code_mirror_raw_value("{{Foo}}={{Name}}")

        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()

        code_data_value = self.get_codemirror_value(self.browser)    

        if code_data_value.find("John Appleseed") > 0:
            self.print_success("test_post_raw_environment")
            return True
        else:
            self.print_failed("test_post_raw_environment")
            return False

    def test_post_raw_json_environment(self):
        self.reset_request()

        self.set_url_field(self.browser, "http://localhost:5000/{{path_post}}")

        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("POST")

        # Select urlencoded
        self.browser.find_element_by_css_selector("#data-mode-selector a:nth-of-type(3)").click()

        self.set_code_mirror_raw_value("{\"{{Foo}}\":\"{{Name}}\"")

        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()

        code_data_value = self.get_codemirror_value(self.browser)    

        if code_data_value.find("John Appleseed") > 0:
            self.print_success("test_post_raw_json_environment")
            return True
        else:
            self.print_failed("test_post_raw_json_environment")
            return False
