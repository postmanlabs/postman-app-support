from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.select import Select
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import selenium.webdriver.chrome.service as service
import inspect
import time
from postman_tests import PostmanTests

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
        self.set_url_field(self.browser, "http://localhost:5000/delete")
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

        time.sleep(1)

        submit_button = self.browser.find_element_by_css_selector("#modal-add-to-collection .modal-footer .btn-primary")
        submit_button.click()
        
        time.sleep(0.5)

        collection_items = self.browser.find_elements_by_css_selector("#collection-items li")
        if len(collection_items) > 1:
            self.print_success("test_create_collection_with_request")
        else:
            self.print_failed("test_create_collection_with_request")
        

    def test_add_request_to_existing_collection(self):
        self.set_url_field(self.browser, "http://localhost:5000/post")
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
        time.sleep(3)

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
