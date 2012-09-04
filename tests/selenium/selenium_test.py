from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
import selenium.webdriver.chrome.service as service

def load_postman(browser):
    browser.get('chrome-extension://bgkigemnbmleogooeggblbgpphhhghoa/index.html')

def test_title(browser):
    assert "Postman" in browser.title

def test_indexed_db(browser):
    w = WebDriverWait(browser, 10)
    w.until(lambda driver: browser.find_element_by_css_selector("#sidebar-section-history .empty-message"))
    
    print "test_indexed_db successful"

def test_get_basic(browser):
    url_field = browser.find_element_by_id("url")
    url_field.send_keys("http://httpbin.org/html")
    
    send_button = browser.find_element_by_id("submit-request")
    send_button.click()
    
    response_container = browser.find_element_by_id("response")

    w = WebDriverWait(browser, 20)
    w.until(lambda x: browser.find_element_by_css_selector("#response-as-code .CodeMirror"))
    print "test_get_basic successful"

    code_data_textarea = browser.find_element_by_css_selector("#response-as-code .CodeMirror")
    code_data_value = browser.execute_script("return arguments[0].innerHTML", code_data_textarea)

    if code_data_value.find("html") > 0:
        print "test_get_basic content test successful"
    else:
        print "test_get_basic content test failed"

def test_delete_basic(browser):
    pass

def test_head_basic(browser):
    pass

def test_options_basic(browser):
    pass

def main():
    s = service.Service('/Users/asthana/Documents/www/chromedriver')  # Optional argument, if not specified will search path.
    s.start()
    
    capabilities = {'chrome.switches': ["--load-extension=/Users/asthana/Documents/www/POSTMan-Chrome-Extension/chrome"]}
    browser = webdriver.Remote(s.service_url, capabilities)
    
    load_postman(browser)
    test_title(browser)
    test_indexed_db(browser)
    test_get_basic(browser)

    browser.quit()

if __name__ == "__main__":
    main()
