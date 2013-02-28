from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.select import Select
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import selenium.webdriver.chrome.service as service
import inspect
import time         
from postman_tests import PostmanTests

class PostmanTestsEnvironments(PostmanTests):
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

    def test_1_add_environment(self):
        self.init_environment()

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

        add_env_button = self.browser.find_element_by_css_selector("#environments-list-wrapper .toolbar .environments-actions-add")
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
            return True
        else:
            return False
        

    def test_2_delete_environment(self):
        delete_button = self.browser.find_element_by_css_selector("#environments-list tbody tr:first-child .environment-action-delete")
        delete_button.click()
        
        environments_list = self.browser.find_element_by_id("environments-list")
        environments_list_value = self.browser.execute_script("return arguments[0].innerHTML", environments_list)

        if environments_list_value.find("Test another environment") < 0:
            return True
        else:
            return False
        
    def test_3_edit_environment(self):
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
            return True
        else:
            return False


    def test_4_globals(self):
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
            return True
        else:
            return False

PostmanTestsEnvironments().run()
