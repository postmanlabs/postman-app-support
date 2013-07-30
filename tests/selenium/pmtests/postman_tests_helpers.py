from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.select import Select
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import selenium.webdriver.chrome.service as service
import inspect
import time
from postman_tests import PostmanTests

class PostmanTestsHelpers(PostmanTests):
    def test_1_basic_auth_plain(self):
        basic_auth_selector = self.browser.find_element_by_css_selector("#request-types .request-helper-tabs li:nth-of-type(2)")
        basic_auth_selector.click()
        
        username = self.browser.find_element_by_id("request-helper-basicAuth-username")
        password = self.browser.find_element_by_id("request-helper-basicAuth-password")

        username.clear()
        password.clear()

        username.send_keys("Aladin")
        password.send_keys("sesam open")

        refresh_headers = self.browser.find_element_by_css_selector("#request-helper-basicAuth .request-helper-submit")
        refresh_headers.click()

        header_first_key = self.browser.find_element_by_css_selector("#headers-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-key").get_attribute("value")
        header_first_value = self.browser.find_element_by_css_selector("#headers-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-value").get_attribute("value")
        
        if header_first_key == "Authorization" and header_first_value == "Basic QWxhZGluOnNlc2FtIG9wZW4=":
            return True
        else:
            return False


    def test_2_basic_auth_environment(self):
        self.reset_request()

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
        environment_name.send_keys("Test basic auth environment")

        first_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-key")
        first_key.clear()
        first_key.send_keys("basic_key")

        first_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-value")
        first_val.clear()
        first_val.send_keys("Aladin")

        second_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-key")
        second_key.clear()
        second_key.send_keys("basic_val")

        second_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-value")
        second_val.clear()
        second_val.send_keys("sesam open") 

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

        basic_auth_selector = self.browser.find_element_by_css_selector("#request-types .request-helper-tabs li:nth-of-type(2)")
        basic_auth_selector.click()
        
        username = self.browser.find_element_by_id("request-helper-basicAuth-username")
        password = self.browser.find_element_by_id("request-helper-basicAuth-password")

        username.clear()
        password.clear()

        username.send_keys("{{basic_key}}")
        password.send_keys("{{basic_val}}")

        refresh_headers = self.browser.find_element_by_css_selector("#request-helper-basicAuth .request-helper-submit")
        refresh_headers.click()

        header_first_key = self.browser.find_element_by_css_selector("#headers-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-key").get_attribute("value")
        header_first_value = self.browser.find_element_by_css_selector("#headers-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-value").get_attribute("value")
        
        if header_first_key == "Authorization" and header_first_value == "Basic QWxhZGluOnNlc2FtIG9wZW4=":
            return True
        else:
            return False

    def test_3_oauth1_plain_get(self):
        self.reset_request()

        oauth1_selector = self.browser.find_element_by_css_selector("#request-types .request-helper-tabs li:nth-of-type(4)")
        oauth1_selector.click()

        consumer_key = self.browser.find_element_by_id("request-helper-oauth1-consumerKey")      
        consumer_secret = self.browser.find_element_by_id("request-helper-oauth1-consumerSecret")
        token = self.browser.find_element_by_id("request-helper-oauth1-token")
        token_secret = self.browser.find_element_by_id("request-helper-oauth1-tokenSecret")
        timestamp = self.browser.find_element_by_id("request-helper-oauth1-timestamp")
        nonce = self.browser.find_element_by_id("request-helper-oauth1-nonce")
        version = self.browser.find_element_by_id("request-helper-oauth1-version")

        # From OAuth example
        self.set_url_field(self.browser, "http://photos.example.net/photos?size=original&file=vacation.jpg")

        consumer_key.clear()
        consumer_key.send_keys("dpf43f3p2l4k3l03")

        nonce.clear()
        nonce.send_keys("kllo9940pd9333jh")

        timestamp.clear()
        timestamp.send_keys("1191242096")

        token.clear()
        token.send_keys("nnch734d00sl2jdk")

        consumer_secret.clear()
        consumer_secret.send_keys("kd94hf93k423kf44")

        token_secret.clear()
        token_secret.send_keys("pfkkdhi9sl3r4s00")
        
        refresh_headers = self.browser.find_element_by_css_selector("#request-helper-oAuth1 .request-helper-submit")
        refresh_headers.click()

        input_elements = self.browser.find_elements_by_css_selector("#url-keyvaleditor .keyvalueeditor-row")
        
        found_oauth_signature = False
        for element in input_elements:
            value = self.browser.execute_script("return arguments[0].innerHTML", element)            

            if value.find("oauth_signature") > 0:
                found_oauth_signature = True
                if value.find("tR3+Ty81lMeYAr/Fid0kMTYa/WM=") > 0:
                    found_oauth_signature = True
                else:
                    found_oauth_signature = False
    

        if found_oauth_signature is True:
            return True
        else:
            return False

    def test_4_oauth1_formdata_post(self):
        self.reset_request()

        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("POST")

        # From OAuth example
        self.set_url_field(self.browser, "http://photos.example.net/photos")

        first_formdata_key = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-key")
        first_formdata_key.clear()
        first_formdata_key.send_keys("size")

        first_formdata_value = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-value")
        first_formdata_value.clear()
        first_formdata_value.send_keys("original")

        second_formdata_key = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-key")
        second_formdata_key.clear()
        second_formdata_key.send_keys("file")

        second_formdata_value = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-value")
        second_formdata_value.clear()
        second_formdata_value.send_keys("vacation.jpg")

        oauth1_selector = self.browser.find_element_by_css_selector("#request-types .request-helper-tabs li:nth-of-type(4)")
        oauth1_selector.click()

        consumer_key = self.browser.find_element_by_id("request-helper-oauth1-consumerKey")      
        consumer_secret = self.browser.find_element_by_id("request-helper-oauth1-consumerSecret")
        token = self.browser.find_element_by_id("request-helper-oauth1-token")
        token_secret = self.browser.find_element_by_id("request-helper-oauth1-tokenSecret")
        timestamp = self.browser.find_element_by_id("request-helper-oauth1-timestamp")
        nonce = self.browser.find_element_by_id("request-helper-oauth1-nonce")
        version = self.browser.find_element_by_id("request-helper-oauth1-version")

        consumer_key.clear()
        consumer_key.send_keys("dpf43f3p2l4k3l03")

        nonce.clear()
        nonce.send_keys("kllo9940pd9333jh")

        timestamp.clear()
        timestamp.send_keys("1191242096")

        token.clear()
        token.send_keys("nnch734d00sl2jdk")

        consumer_secret.clear()
        consumer_secret.send_keys("kd94hf93k423kf44")

        token_secret.clear()
        token_secret.send_keys("pfkkdhi9sl3r4s00")
        
        refresh_headers = self.browser.find_element_by_css_selector("#request-helper-oAuth1 .request-helper-submit")
        refresh_headers.click()

        input_elements = self.browser.find_elements_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row")
        
        found_oauth_signature = False
        for element in input_elements:
            value = self.browser.execute_script("return arguments[0].innerHTML", element)            

            if value.find("oauth_signature") > 0:
                found_oauth_signature = True
                if value.find("wPkvxykrw+BTdCcGqKr+3I+PsiM=") > 0:
                    found_oauth_signature = True
                else:
                    found_oauth_signature = False
    

        if found_oauth_signature is True:
            return True
        else:
            return False

    def test_5_oauth1_formdata_post_missing_http(self):
        self.reset_request()

        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("POST")

        # From OAuth example
        self.set_url_field(self.browser, "photos.example.net/photos")

        first_formdata_key = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-key")
        first_formdata_key.clear()
        first_formdata_key.send_keys("size")

        first_formdata_value = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-value")
        first_formdata_value.clear()
        first_formdata_value.send_keys("original")

        second_formdata_key = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-key")
        second_formdata_key.clear()
        second_formdata_key.send_keys("file")

        second_formdata_value = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-value")
        second_formdata_value.clear()
        second_formdata_value.send_keys("vacation.jpg")

        oauth1_selector = self.browser.find_element_by_css_selector("#request-types .request-helper-tabs li:nth-of-type(4)")
        oauth1_selector.click()

        consumer_key = self.browser.find_element_by_id("request-helper-oauth1-consumerKey")      
        consumer_secret = self.browser.find_element_by_id("request-helper-oauth1-consumerSecret")
        token = self.browser.find_element_by_id("request-helper-oauth1-token")
        token_secret = self.browser.find_element_by_id("request-helper-oauth1-tokenSecret")
        timestamp = self.browser.find_element_by_id("request-helper-oauth1-timestamp")
        nonce = self.browser.find_element_by_id("request-helper-oauth1-nonce")
        version = self.browser.find_element_by_id("request-helper-oauth1-version")

        consumer_key.clear()
        consumer_key.send_keys("dpf43f3p2l4k3l03")

        nonce.clear()
        nonce.send_keys("kllo9940pd9333jh")

        timestamp.clear()
        timestamp.send_keys("1191242096")

        token.clear()
        token.send_keys("nnch734d00sl2jdk")

        consumer_secret.clear()
        consumer_secret.send_keys("kd94hf93k423kf44")

        token_secret.clear()
        token_secret.send_keys("pfkkdhi9sl3r4s00")
        
        refresh_headers = self.browser.find_element_by_css_selector("#request-helper-oAuth1 .request-helper-submit")
        refresh_headers.click()

        input_elements = self.browser.find_elements_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row")
        
        found_oauth_signature = False
        for element in input_elements:
            value = self.browser.execute_script("return arguments[0].innerHTML", element)            

            if value.find("oauth_signature") > 0:
                found_oauth_signature = True
                if value.find("wPkvxykrw+BTdCcGqKr+3I+PsiM=") > 0:
                    found_oauth_signature = True
                else:
                    found_oauth_signature = False
    

        if found_oauth_signature is True:
            return True
        else:
            return False

    def test_6_oauth1_urlencoded_post(self):
        self.reset_request()

        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("POST")

        # Select urlencoded
        self.browser.find_element_by_css_selector("#data-mode-selector a:nth-of-type(2)").click()

        # From OAuth example
        self.set_url_field(self.browser, "http://photos.example.net/photos")

        first_formdata_key = self.browser.find_element_by_css_selector("#urlencoded-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-key")
        first_formdata_key.clear()
        first_formdata_key.send_keys("size")

        first_formdata_value = self.browser.find_element_by_css_selector("#urlencoded-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-value")
        first_formdata_value.clear()
        first_formdata_value.send_keys("original")

        second_formdata_key = self.browser.find_element_by_css_selector("#urlencoded-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-key")
        second_formdata_key.clear()
        second_formdata_key.send_keys("file")

        second_formdata_value = self.browser.find_element_by_css_selector("#urlencoded-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-value")
        second_formdata_value.clear()
        second_formdata_value.send_keys("vacation.jpg")

        oauth1_selector = self.browser.find_element_by_css_selector("#request-types .request-helper-tabs li:nth-of-type(4)")
        oauth1_selector.click()

        consumer_key = self.browser.find_element_by_id("request-helper-oauth1-consumerKey")      
        consumer_secret = self.browser.find_element_by_id("request-helper-oauth1-consumerSecret")
        token = self.browser.find_element_by_id("request-helper-oauth1-token")
        token_secret = self.browser.find_element_by_id("request-helper-oauth1-tokenSecret")
        timestamp = self.browser.find_element_by_id("request-helper-oauth1-timestamp")
        nonce = self.browser.find_element_by_id("request-helper-oauth1-nonce")
        version = self.browser.find_element_by_id("request-helper-oauth1-version")

        consumer_key.clear()
        consumer_key.send_keys("dpf43f3p2l4k3l03")

        nonce.clear()
        nonce.send_keys("kllo9940pd9333jh")

        timestamp.clear()
        timestamp.send_keys("1191242096")

        token.clear()
        token.send_keys("nnch734d00sl2jdk")

        consumer_secret.clear()
        consumer_secret.send_keys("kd94hf93k423kf44")

        token_secret.clear()
        token_secret.send_keys("pfkkdhi9sl3r4s00")
        
        refresh_headers = self.browser.find_element_by_css_selector("#request-helper-oAuth1 .request-helper-submit")
        refresh_headers.click()

        input_elements = self.browser.find_elements_by_css_selector("#urlencoded-keyvaleditor .keyvalueeditor-row")
        
        found_oauth_signature = False
        for element in input_elements:
            value = self.browser.execute_script("return arguments[0].innerHTML", element)            

            if value.find("oauth_signature") > 0:
                found_oauth_signature = True
                if value.find("wPkvxykrw+BTdCcGqKr+3I+PsiM=") > 0:
                    found_oauth_signature = True
                else:
                    found_oauth_signature = False
    

        if found_oauth_signature is True:
            return True
        else:
            return False
    
    def test_7_oauth1_post_headers(self):
        self.reset_request()

        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("POST")

        # From OAuth example
        self.set_url_field(self.browser, "http://photos.example.net/photos")

        first_formdata_key = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-key")
        first_formdata_key.clear()
        first_formdata_key.send_keys("size")

        first_formdata_value = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(1) .keyvalueeditor-value")
        first_formdata_value.clear()
        first_formdata_value.send_keys("original")

        second_formdata_key = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-key")
        second_formdata_key.clear()
        second_formdata_key.send_keys("file")

        second_formdata_value = self.browser.find_element_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-value")
        second_formdata_value.clear()
        second_formdata_value.send_keys("vacation.jpg")

        oauth1_selector = self.browser.find_element_by_css_selector("#request-types .request-helper-tabs li:nth-of-type(4)")
        oauth1_selector.click()

        consumer_key = self.browser.find_element_by_id("request-helper-oauth1-consumerKey")      
        consumer_secret = self.browser.find_element_by_id("request-helper-oauth1-consumerSecret")
        token = self.browser.find_element_by_id("request-helper-oauth1-token")
        token_secret = self.browser.find_element_by_id("request-helper-oauth1-tokenSecret")
        timestamp = self.browser.find_element_by_id("request-helper-oauth1-timestamp")
        nonce = self.browser.find_element_by_id("request-helper-oauth1-nonce")
        version = self.browser.find_element_by_id("request-helper-oauth1-version")

        consumer_key.clear()
        consumer_key.send_keys("dpf43f3p2l4k3l03")

        nonce.clear()
        nonce.send_keys("kllo9940pd9333jh")

        timestamp.clear()
        timestamp.send_keys("1191242096")

        token.clear()
        token.send_keys("nnch734d00sl2jdk")

        consumer_secret.clear()
        consumer_secret.send_keys("kd94hf93k423kf44")

        token_secret.clear()
        token_secret.send_keys("pfkkdhi9sl3r4s00")
        
        add_to_header = self.browser.find_element_by_id("request-helper-oauth1-header")
        add_to_header.click()

        refresh_headers = self.browser.find_element_by_css_selector("#request-helper-oAuth1 .request-helper-submit")
        refresh_headers.click()

        input_elements = self.browser.find_elements_by_css_selector("#headers-keyvaleditor .keyvalueeditor-row")
        
        found_oauth_signature = False
        for element in input_elements:
            value = self.browser.execute_script("return arguments[0].innerHTML", element)            

            if value.find("oauth_signature") > 0:
                found_oauth_signature = True
                if value.find("wPkvxykrw%2BBTdCcGqKr%2B3I%2BPsiM%3D") > 0:
                    if value.find("realm") > 0:
                        found_oauth_signature = True
                    else:
                        found_oauth_signature = False
                else:
                    found_oauth_signature = False
    

        if found_oauth_signature is True:
            return True
        else:
            return False

    def test_8_oauth1_post_environment(self):
        self.reset_request()

        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("POST")

        # From OAuth example
        self.set_url_field(self.browser, "{{url}}")

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
        environment_name.send_keys("Test oauth 1 environment")

        first_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-key")
        first_key.clear()
        first_key.send_keys("consumer_key")

        first_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-value")
        first_val.clear()
        first_val.send_keys("dpf43f3p2l4k3l03")

        second_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-key")
        second_key.clear()
        second_key.send_keys("consumer_secret")

        second_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-value")
        second_val.clear()
        second_val.send_keys("kd94hf93k423kf44")

        third_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(3) .keyvalueeditor-key")
        third_key.clear()
        third_key.send_keys("token")

        third_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(3) .keyvalueeditor-value")
        third_val.clear()
        third_val.send_keys("nnch734d00sl2jdk")

        fourth_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(4) .keyvalueeditor-key")
        fourth_key.clear()
        fourth_key.send_keys("token_secret")

        fourth_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(4) .keyvalueeditor-value")
        fourth_val.clear()
        fourth_val.send_keys("pfkkdhi9sl3r4s00")

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
        manage_env_link = self.browser.find_element_by_css_selector("#environment-selector .dropdown-menu li:nth-of-type(2) a")
        manage_env_link.click()

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

        oauth1_selector = self.browser.find_element_by_css_selector("#request-types .request-helper-tabs li:nth-of-type(4)")
        oauth1_selector.click()

        consumer_key = self.browser.find_element_by_id("request-helper-oauth1-consumerKey")      
        consumer_secret = self.browser.find_element_by_id("request-helper-oauth1-consumerSecret")
        token = self.browser.find_element_by_id("request-helper-oauth1-token")
        token_secret = self.browser.find_element_by_id("request-helper-oauth1-tokenSecret")
        timestamp = self.browser.find_element_by_id("request-helper-oauth1-timestamp")
        nonce = self.browser.find_element_by_id("request-helper-oauth1-nonce")
        version = self.browser.find_element_by_id("request-helper-oauth1-version")

        consumer_key.clear()
        consumer_key.send_keys("{{consumer_key}}")

        nonce.clear()
        nonce.send_keys("{{nonce}}")

        timestamp.clear()
        timestamp.send_keys("{{timestamp}}")

        token.clear()
        token.send_keys("{{token}}")

        token_secret.clear()
        token_secret.send_keys("{{token_secret}}")

        consumer_secret.clear()
        consumer_secret.send_keys("{{consumer_secret}}")

        add_to_header = self.browser.find_element_by_id("request-helper-oauth1-header")
        add_to_header.click()

        refresh_headers = self.browser.find_element_by_css_selector("#request-helper-oAuth1 .request-helper-submit")
        refresh_headers.click()

        input_elements = self.browser.find_elements_by_css_selector("#formdata-keyvaleditor .keyvalueeditor-row")
        
        found_oauth_signature = False
        for element in input_elements:
            value = self.browser.execute_script("return arguments[0].innerHTML", element)            

            if value.find("oauth_signature") > 0:
                found_oauth_signature = True
                if value.find("wPkvxykrw+BTdCcGqKr+3I+PsiM=") > 0:
                    found_oauth_signature = True
                else:
                    found_oauth_signature = False
    

        if found_oauth_signature is True:
            return True
        else:
            return False

    def test_9_digest_get_headers(self):
        self.reset_request()

        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("GET")

        # Example from the Python requests library
        self.set_url_field(self.browser, "http://httpbin.org/digest-auth/auth/user/pass")

        digest_selector = self.browser.find_element_by_css_selector("#request-types .request-helper-tabs li:nth-of-type(3)")
        digest_selector.click()

        username = self.browser.find_element_by_id("request-helper-digestAuth-username")      
        realm = self.browser.find_element_by_id("request-helper-digestAuth-realm")
        password = self.browser.find_element_by_id("request-helper-digestAuth-password")
        nonce = self.browser.find_element_by_id("request-helper-digestAuth-nonce")
        algorithm = self.browser.find_element_by_id("request-helper-digestAuth-algorithm")
        qop = self.browser.find_element_by_id("request-helper-digestAuth-qop")
        nonce_count = self.browser.find_element_by_id("request-helper-digestAuth-nonceCount")
        client_nonce = self.browser.find_element_by_id("request-helper-digestAuth-clientNonce")
        opaque = self.browser.find_element_by_id("request-helper-digestAuth-opaque")

        username.clear()
        realm.clear()
        password.clear()
        nonce.clear()
        algorithm.clear()
        qop.clear()
        nonce_count.clear()
        client_nonce.clear()
        opaque.clear()

        username.send_keys("user")
        realm.send_keys("me@kennethreitz.com")
        password.send_keys("pass")
        nonce.send_keys("59c177ca4c8aa616a0e0007717a2225d")
        algorithm.send_keys("MD5")
        qop.send_keys("auth")
        nonce_count.send_keys("00000002")
        client_nonce.send_keys("a621deed62b2ff96")
        opaque.send_keys("c68f9b6d2ccdf56c49945e0788fd1017")
        
        refresh_headers = self.browser.find_element_by_css_selector("#request-helper-digestAuth .request-helper-submit")
        refresh_headers.click()

        input_elements = self.browser.find_elements_by_css_selector("#headers-keyvaleditor .keyvalueeditor-row")            

        found_digest_response = False
        for element in input_elements:
            value = self.browser.execute_script("return arguments[0].innerHTML", element)            

            if value.find("response") > 0:
                found_digest_response = True
                if value.find("bf0ed74d6a422565ba9aae6d0e36f7b9") > 0:
                    if value.find("realm") > 0:
                        found_digest_response = True
                    else:
                        found_digest_response = False
                else:
                    found_digest_response = False
    

        if found_digest_response is True:
            return True
        else:
            return False    
        
    def test_10_digest_post_environment(self):
        self.reset_request()

        method_select = self.browser.find_element_by_id("request-method-selector")    
        Select(method_select).select_by_value("GET")

        # From OAuth example
        self.set_url_field(self.browser, "http://httpbin.org/digest-auth/auth/user/pass")

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
        environment_name.send_keys("Test digest environment")

        first_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-key")
        first_key.clear()
        first_key.send_keys("username")

        first_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:first-child .keyvalueeditor-value")
        first_val.clear()
        first_val.send_keys("user")

        second_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-key")
        second_key.clear()
        second_key.send_keys("realm")

        second_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(2) .keyvalueeditor-value")
        second_val.clear()
        second_val.send_keys("me@kennethreitz.com")

        third_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(3) .keyvalueeditor-key")
        third_key.clear()
        third_key.send_keys("password")

        third_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(3) .keyvalueeditor-value")
        third_val.clear()
        third_val.send_keys("pass")

        fourth_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(4) .keyvalueeditor-key")
        fourth_key.clear()
        fourth_key.send_keys("nonce")

        fourth_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(4) .keyvalueeditor-value")
        fourth_val.clear()
        fourth_val.send_keys("59c177ca4c8aa616a0e0007717a2225d")

        fifth_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(5) .keyvalueeditor-key")
        fifth_key.clear()
        fifth_key.send_keys("algorithm")

        fifth_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(5) .keyvalueeditor-value")
        fifth_val.clear()
        fifth_val.send_keys("MD5")

        sixth_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(6) .keyvalueeditor-key")
        sixth_key.clear()
        sixth_key.send_keys("qop")

        sixth_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(6) .keyvalueeditor-value")
        sixth_val.clear()
        sixth_val.send_keys("auth")

        seventh_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(7) .keyvalueeditor-key")
        seventh_key.clear()
        seventh_key.send_keys("nonce_count")

        seventh_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(7) .keyvalueeditor-value")
        seventh_val.clear()
        seventh_val.send_keys("00000002")

        eigth_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(8) .keyvalueeditor-key")
        eigth_key.clear()
        eigth_key.send_keys("client_nonce")

        eigth_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(8) .keyvalueeditor-value")
        eigth_val.clear()
        eigth_val.send_keys("a621deed62b2ff96")

        ninth_key = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(9) .keyvalueeditor-key")
        ninth_key.clear()
        ninth_key.send_keys("opaque")

        ninth_val = self.browser.find_element_by_css_selector("#environment-keyvaleditor .keyvalueeditor-row:nth-of-type(9) .keyvalueeditor-value")
        ninth_val.clear()
        ninth_val.send_keys("c68f9b6d2ccdf56c49945e0788fd1017")

        submit_button = self.browser.find_element_by_css_selector("#modal-environments .environments-actions-add-submit")
        submit_button.click()
        time.sleep(0.3)

        close_button = self.browser.find_element_by_css_selector("#modal-environments .modal-header .close")
        close_button.click()

        time.sleep(1)

        environment_selector = self.browser.find_element_by_id("environment-selector")
        environment_selector.click()

        # Select the environment
        manage_env_link = self.browser.find_element_by_css_selector("#environment-selector .dropdown-menu li:nth-of-type(2) a")
        manage_env_link.click()

        digest_selector = self.browser.find_element_by_css_selector("#request-types .request-helper-tabs li:nth-of-type(3)")
        digest_selector.click()

        username = self.browser.find_element_by_id("request-helper-digestAuth-username")      
        realm = self.browser.find_element_by_id("request-helper-digestAuth-realm")
        password = self.browser.find_element_by_id("request-helper-digestAuth-password")
        nonce = self.browser.find_element_by_id("request-helper-digestAuth-nonce")
        algorithm = self.browser.find_element_by_id("request-helper-digestAuth-algorithm")
        qop = self.browser.find_element_by_id("request-helper-digestAuth-qop")
        nonce_count = self.browser.find_element_by_id("request-helper-digestAuth-nonceCount")
        client_nonce = self.browser.find_element_by_id("request-helper-digestAuth-clientNonce")
        opaque = self.browser.find_element_by_id("request-helper-digestAuth-opaque")

        username.clear()
        realm.clear()
        password.clear()
        nonce.clear()
        algorithm.clear()
        qop.clear()
        nonce_count.clear()
        client_nonce.clear()
        opaque.clear()

        username.send_keys("{{username}}")
        realm.send_keys("{{realm}}")
        password.send_keys("{{password}}")
        nonce.send_keys("{{nonce}}")
        algorithm.send_keys("{{algorithm}}")
        qop.send_keys("{{qop}}")
        nonce_count.send_keys("{{nonce_count}}")
        client_nonce.send_keys("{{client_nonce}}")
        opaque.send_keys("{{opaque}}")
        
        refresh_headers = self.browser.find_element_by_css_selector("#request-helper-digestAuth .request-helper-submit")
        refresh_headers.click()

        input_elements = self.browser.find_elements_by_css_selector("#headers-keyvaleditor .keyvalueeditor-row")
        
        found_digest_response = False
        for element in input_elements:
            value = self.browser.execute_script("return arguments[0].innerHTML", element)            
            if value.find("response") > 0:
                found_digest_response = True
                if value.find("bf0ed74d6a422565ba9aae6d0e36f7b9") > 0:
                    if value.find("realm") > 0:
                        found_digest_response = True
                    else:
                        found_digest_response = False
                else:
                    found_digest_response = False
    

        if found_digest_response is True:
            return True
        else:
            return False

PostmanTestsHelpers().run()
