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

class PostmanTestsCollections(PostmanTests):
    def run(self):
        print "\nTesting collections"
        print "---------------------"
        self.test_switch_to_collections()
        self.test_create_collection_with_modal()
        self.test_create_collection_with_request()
        self.test_add_request_to_existing_collection()
        self.test_add_collection_request_to_existing_collection()
        self.test_delete_collection_request()
        self.test_delete_collection()
        self.test_import_collection_from_url()
        self.browser.quit()

    def test_switch_to_collections(self):
        collection_tab = self.browser.find_element_by_css_selector("#sidebar-selectors li:nth-of-type(2)")
        collection_tab.click()

        sidebar_section_collections = self.browser.find_element_by_id("sidebar-section-collections")
        if sidebar_section_collections.get_attribute("style").find("block") > 0:
            self.print_success("test_switch_to_collections")
        else:
            self.print_failed("test_switch_to_collections")

    def test_create_collection_with_modal(self):
        add_link = self.browser.find_element_by_css_selector("#collections-options a:nth-of-type(1)")
        add_link.click()
        time.sleep(0.5)

        new_collection_blank = self.browser.find_element_by_id("new-collection-blank")
        new_collection_blank.clear()
        new_collection_blank.send_keys("Test collection")

        new_collection_submit = self.browser.find_element_by_css_selector("#modal-new-collection .modal-footer .btn-primary")
        new_collection_submit.click()

        time.sleep(0.25)

        collection_items = self.browser.find_elements_by_css_selector("#collection-items li")

        if len(collection_items) > 0:
            self.print_success("test_create_collection_with_modal")
        else:
            self.print_failed("test_create_collection_with_modal")

    def test_create_collection_with_request(self):
        self.set_url_field(self.browser, "http://httpbin.org/delete")
        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("DELETE")
        send_button = self.browser.find_element_by_id("submit-request")
        send_button.click()

        # Waits for the response
        self.get_codemirror_value(self.browser)

        add_to_collection = self.browser.find_element_by_id("add-to-collection")
        add_to_collection.click()

        time.sleep(0.5)

        new_collection_input = self.browser.find_element_by_id("new-collection")
        new_collection_input.clear()
        new_collection_input.send_keys("Existing request collection")
        
        submit_button = self.browser.find_element_by_css_selector("#modal-add-to-collection .modal-footer .btn-primary")
        submit_button.click()
        
        time.sleep(0.5)

        collection_items = self.browser.find_elements_by_css_selector("#collection-items li")
        if len(collection_items) > 1:
            self.print_success("test_create_collection_with_request")
        else:
            self.print_failed("test_create_collection_with_request")
        

    def test_add_request_to_existing_collection(self):
        self.set_url_field(self.browser, "http://httpbin.org/post")
        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("POST")

        add_to_collection = self.browser.find_element_by_id("add-to-collection")
        add_to_collection.click()

        time.sleep(0.5)

        select_collection = self.browser.find_element_by_id("select-collection")
        Select(select_collection).select_by_index(1)

        request_name = self.browser.find_element_by_id("new-request-name")
        request_name.clear()
        request_name.send_keys("New request")

        submit_button = self.browser.find_element_by_css_selector("#modal-add-to-collection .modal-footer .btn-primary")
        submit_button.click()
        
        time.sleep(0.5)

        requests = self.browser.find_elements_by_css_selector("#collection-items li:nth-of-type(1) ul li")
        
        if len(requests) > 0:
            self.print_success("test_add_request_to_existing_collection")
        else:
            self.print_failed("test_add_request_to_existing_collection")

    def test_add_collection_request_to_existing_collection(self):
        request = self.browser.find_element_by_css_selector("#collection-items li:nth-of-type(1) ul li:nth-of-type(1) .request a")
        request.click()
        time.sleep(0.5)

        add_to_collection = self.browser.find_element_by_id("add-to-collection")
        add_to_collection.click()

        time.sleep(0.5)

        select_collection = self.browser.find_element_by_id("select-collection")
        Select(select_collection).select_by_index(2)

        request_name = self.browser.find_element_by_id("new-request-name")
        request_name.clear()
        request_name.send_keys("New request")

        submit_button = self.browser.find_element_by_css_selector("#modal-add-to-collection .modal-footer .btn-primary")
        submit_button.click()
        
        time.sleep(0.5)

        requests = self.browser.find_elements_by_css_selector("#collection-items li:nth-of-type(2) ul li")
        
        if len(requests) > 1:
            self.print_success("test_add_collection_request_to_existing_collection")
        else:
            self.print_failed("test_add_collection_request_to_existing_collection")


    def test_delete_collection_request(self):
        request = self.browser.find_element_by_css_selector("#collection-items li:nth-of-type(1) ul li:nth-of-type(1) .request")
        hov = ActionChains(self.browser).move_to_element(request)
        hov.perform()

        request_delete = self.browser.find_element_by_css_selector("#collection-items li:nth-of-type(1) ul li:nth-of-type(1) .request-actions .request-actions-delete")
        request_delete.click()
        time.sleep(0.5)

        requests = self.browser.find_elements_by_css_selector("#collection-items li:nth-of-type(1) ul li")
        
        if len(requests) == 0:
            self.print_success("test_delete_collection_request")
        else:
            self.print_failed("test_delete_collection_request")

    def test_delete_collection(self):
        collection = self.browser.find_element_by_css_selector("#collection-items li:nth-of-type(1)")
        hov = ActionChains(self.browser).move_to_element(collection)
        hov.perform()

        collection_delete = self.browser.find_element_by_css_selector("#collection-items li:nth-of-type(1) .sidebar-collection-head .collection-head-actions .collection-actions-delete")
        collection_delete.click()

        time.sleep(1)

        modal_collection_delete = self.browser.find_element_by_id("modal-delete-collection-yes")
        modal_collection_delete.click()
        time.sleep(1)

        collection_items = self.browser.find_elements_by_css_selector("#collection-items li.sidebar-collection")

        if len(collection_items) == 1:
            self.print_success("test_delete_collection")
        else:
            self.print_failed("test_delete_collection")

    def test_import_collection_from_url(self):
        add_link = self.browser.find_element_by_css_selector("#collections-options a:nth-of-type(2)")
        add_link.click()
        time.sleep(0.5)

        import_collection_url = self.browser.find_element_by_id("import-collection-url-input")
        import_collection_url.clear()
        import_collection_url.send_keys("http://www.getpostman.com/collections/2a")

        time.sleep(0.5)

        import_collection_submit = self.browser.find_element_by_id("import-collection-url-submit")
        import_collection_submit.click()

        time.sleep(3)

        collection_items = self.browser.find_elements_by_css_selector("#collection-items li.sidebar-collection")

        if len(collection_items) == 2:
            self.print_success("test_import_collection_from_url")
        else:
            self.print_failed("test_import_collection_from_url")

class PostmanTestsEnvironments(PostmanTests):
    def run(self):
        print "\nTesting environments"
        print "---------------------"
        self.test_add_environment()
        self.test_delete_environment()
        self.test_edit_environment()
        self.test_globals()
        self.browser.quit()

    def test_add_environment(self):
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
        environment_name.send_keys("Test environment")

        first_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-key")
        first_key.clear()
        first_key.send_keys("Foo")

        first_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-value")
        first_val.clear()
        first_val.send_keys("Bar")

        submit_button = self.browser.find_element_by_css_selector("#modal-environments .environments-actions-add-submit")
        submit_button.click()
        time.sleep(0.3)

        environments_list = self.browser.find_element_by_id("environments-list")
        environments_list_value = self.browser.execute_script("return arguments[0].innerHTML", environments_list)

        # Add another environment
        add_env_button.click()
        environment_name.clear()
        environment_name.send_keys("Test another environment")

        first_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-key")
        first_key.clear()
        first_key.send_keys("Foo 1")

        first_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-value")
        first_val.clear()
        first_val.send_keys("Bar 1")

        submit_button = self.browser.find_element_by_css_selector("#modal-environments .environments-actions-add-submit")
        submit_button.click()
        time.sleep(0.3)
        
        if environments_list_value.find("Test environment") > 0:
            self.print_success("test_add_environment")
        else:
            self.print_failed("test_add_environment")
        

    def test_delete_environment(self):
        delete_button = self.browser.find_element_by_css_selector("#environments-list tbody tr:first-child .environment-action-delete")
        delete_button.click()
        
        environments_list = self.browser.find_element_by_id("environments-list")
        environments_list_value = self.browser.execute_script("return arguments[0].innerHTML", environments_list)

        if environments_list_value.find("Test environment") < 0:
            self.print_success("test_delete_environment")
        else:
            self.print_failed("test_delete_environment")
        
    def test_edit_environment(self):
        edit_button = self.browser.find_element_by_css_selector("#environments-list tbody tr:first-child .environment-action-edit")
        edit_button.click()

        environment_name = self.browser.find_element_by_id("environment-editor-name")
        environment_name.clear()
        environment_name.send_keys("Test edited environment")

        first_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-key")
        first_key.clear()
        first_key.send_keys("Foo 2")

        first_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-value")
        first_val.clear()
        first_val.send_keys("Bar 2")

        submit_button = self.browser.find_element_by_css_selector("#modal-environments .environments-actions-add-submit")
        submit_button.click()
        time.sleep(0.3)

        environments_list = self.browser.find_element_by_id("environments-list")
        environments_list_value = self.browser.execute_script("return arguments[0].innerHTML", environments_list)        

        if environments_list_value.find("Test edited environment") > 0:
            self.print_success("test_edit_environment")
        else:
            self.print_failed("test_edit_environment")


    def test_globals(self):
        manage_globals_button = self.browser.find_element_by_css_selector("#environments-list-wrapper .toolbar .environments-actions-manage-globals")
        manage_globals_button.click()

        first_key = self.browser.find_element_by_css_selector("#globals-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-key")
        first_key.clear()
        first_key.send_keys("Global Foo")

        first_val = self.browser.find_element_by_css_selector("#globals-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-value")
        first_val.clear()
        first_val.send_keys("Global Bar") 

        second_key = self.browser.find_element_by_css_selector("#globals-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-key")
        second_key.clear()
        second_key.send_keys("Global Foo 1")

        second_val = self.browser.find_element_by_css_selector("#globals-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-value")
        second_val.clear()
        second_val.send_keys("Global Bar 2") 

        submit_button = self.browser.find_element_by_css_selector("#modal-environments .environments-actions-add-back")
        submit_button.click()
        time.sleep(0.3)        

        close_button = self.browser.find_element_by_css_selector("#modal-environments .modal-header .close")
        close_button.click()

        time.sleep(1)

        quicklook = self.browser.find_element_by_id("environment-quicklook")
        hov = ActionChains(self.browser).move_to_element(quicklook)
        hov.perform()
        
        contents = self.browser.find_element_by_id("environment-quicklook-content")
        contents_value = self.browser.execute_script("return arguments[0].innerHTML", contents)

        if contents_value.find("Global Foo") > 0 and contents_value.find("Global Bar") > 0:
            self.print_success("test_globals")
        else:
            self.print_failed("test_globals")
    
def main():
    # PostmanTestsRequests().run()
    # PostmanTestsHistory().run()
    # PostmanTestsLayout().run()
    # PostmanTestsCollections().run()
    PostmanTestsEnvironments().run()

if __name__ == "__main__":
    main()
