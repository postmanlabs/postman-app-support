from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.select import Select
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from colorama import init
from colorama import Fore, Back, Style
import selenium.webdriver.chrome.service as service
import inspect
import time
import traceback

class PostmanTests:
    def __init__(self):
        init()
        s = service.Service('/Users/a85/Documents/www/chromedriver')  # Optional argument, if not specified will search path.
        s.start()
    
        capabilities = {'chrome.switches': ["--load-extension=/Users/asthana/Documents/www/postman/POSTMan-Chrome-Extension/chrome"]}
        browser = webdriver.Remote(s.service_url, capabilities)        
        
        self.s = s
        self.browser = browser
        
        self.load_postman()
        self.init_test_title()
        self.init_test_indexed_db()
        

    def run(self):
        print "\nRunning"
        print "---------------"

        methods = inspect.getmembers(self, predicate=inspect.ismethod)
        allms = []
        for method in methods:
            name = method[0]
            f = method[1]
           
            if name.find("test") == 0:
                order = int(name.split("_")[1])
                m = {
                    "order": order,
                    "method": method[1],
                    "name": method[0]
                    }
                allms.append(m)

        ordered = sorted(allms, key=lambda k: k["order"])

        for m in ordered:
            try:
                result = m["method"]()
            except Exception as e:
                result = False
                print traceback.format_exc()

            if result is True:
                print Fore.WHITE + Back.GREEN + "[PASSED]" + Fore.RESET + Back.RESET + " %s" % m["name"]
            else:
                print Fore.WHITE + Back.RED + "[FAILED]" + Fore.RESET + Back.RESET + " %s" % m["name"]

        self.browser.quit()

    def load_postman(self):
        self.browser.get('chrome-extension://jnmpallcnfmkjffblcbgbfjkccbancha/index.html')

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
        
    def init_test_title(self):
        assert "Postman" in self.browser.title

    def init_test_indexed_db(self):
        w = WebDriverWait(self.browser, 10)
        w.until(lambda driver: self.browser.find_element_by_css_selector("#sidebar-section-history .empty-message"))

        print "\nPostman loaded succesfully."
        return True

    def reset_request(self):
        reset_button = self.browser.find_element_by_id("request-actions-reset")
        reset_button.click()
        time.sleep(0.5)
