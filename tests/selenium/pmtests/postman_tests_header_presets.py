from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.select import Select
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import selenium.webdriver.chrome.service as service
import inspect
import time
from postman_tests import PostmanTests

class PostmanTestsHeaderPresets(PostmanTests):
    def test_1_add_header_preset(self):
        self.reset_request()
        self.browser.find_element_by_id("headers-keyvaleditor-actions-open").click()
        time.sleep(0.1)
        self.browser.find_element_by_id("headers-keyvaleditor-actions-manage-presets").click()
        time.sleep(1)
        self.browser.find_element_by_css_selector("#header-presets-list-wrapper .header-presets-actions-add").click()
        self.browser.find_element_by_id("header-presets-editor-name").send_keys("Test preset")

        first_key = self.browser.find_element_by_css_selector("#header-presets-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-key")
        first_key.clear()
        first_key.send_keys("Global Foo")

        first_val = self.browser.find_element_by_css_selector("#header-presets-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-value")
        first_val.clear()
        first_val.send_keys("Global Bar") 

        second_key = self.browser.find_element_by_css_selector("#header-presets-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-key")
        second_key.clear()
        second_key.send_keys("Global Foo 1")

        second_val = self.browser.find_element_by_css_selector("#header-presets-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-value")
        second_val.clear()
        second_val.send_keys("Global Bar 2")

        self.browser.find_element_by_css_selector(".header-presets-actions-submit").click()
        time.sleep(0.1)

        presets_list = self.browser.find_element_by_id("header-presets-list")
        presets_list_value = self.browser.execute_script("return arguments[0].innerHTML", presets_list)

        if presets_list_value.find("Test preset") > 0:
            return True
        else:            
            return False

    def test_2_edit_header_preset(self):
        self.browser.find_element_by_css_selector("#header-presets-list tbody tr:first-child .header-preset-action-edit").click()
        self.browser.find_element_by_css_selector("#header-presets-editor-name").clear()
        self.browser.find_element_by_css_selector("#header-presets-editor-name").send_keys("Edited preset")
        self.browser.find_element_by_css_selector(".header-presets-actions-submit").click()
        time.sleep(0.1)

        presets_list = self.browser.find_element_by_id("header-presets-list")
        presets_list_value = self.browser.execute_script("return arguments[0].innerHTML", presets_list)

        if presets_list_value.find("Edited preset") > 0:
            return True
        else:            
            return False

    def test_3_select_header_preset(self):
        close_button = self.browser.find_element_by_css_selector("#modal-header-presets .modal-header .close")
        close_button.click()

        time.sleep(1)

        first_key = self.browser.find_element_by_css_selector("#headers-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-key")
        first_key.clear()
        first_key.send_keys("Edit")
        
        autocomplete_menus = self.browser.find_elements_by_css_selector(".ui-autocomplete")
        for menu in autocomplete_menus:
            if menu.text.find("Edited preset") > 0:
                return True

        return False

    def test_4_delete_header_preset(self):
        self.reset_request()
        self.browser.find_element_by_id("headers-keyvaleditor-actions-manage-presets").click()
        time.sleep(1)        

        delete_button = self.browser.find_element_by_css_selector("#header-presets-list tbody tr:first-child .header-preset-action-delete")
        delete_button.click()
        
        header_presets_list = self.browser.find_element_by_id("header-presets-list")
        header_presets_list_value = self.browser.execute_script("return arguments[0].innerHTML", header_presets_list)

        if header_presets_list_value.find("Edited preset") < 0:
            return True
        else:
            return False
        

PostmanTestsHeaderPresets().run()
