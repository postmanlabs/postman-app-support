from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.select import Select
import selenium.webdriver.chrome.service as service

def load_postman(browser):
    browser.get('chrome-extension://ljkndjhokjnonidfaggiacifldihhjmg/index.html')

def test_title(browser):
    assert "Postman" in browser.title

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

def test_indexed_db(browser):
    w = WebDriverWait(browser, 10)
    w.until(lambda driver: browser.find_element_by_css_selector("#sidebar-section-history .empty-message"))
    
    print "test_indexed_db successful"
    return True

def test_get_basic(browser):
    set_url_field(browser, "http://httpbin.org/html")
    
    send_button = browser.find_element_by_id("submit-request")
    send_button.click()

    code_data_value = get_codemirror_value(browser)    

    if code_data_value.find("html") > 0:
        print "test_get_basic test successful"
        return True
    else:
        print "test_get_basic test failed"
        return False

def test_delete_basic(browser):
    set_url_field(browser, "http://httpbin.org/delete")

    method_select = browser.find_element_by_id("request-method-selector")    
    Select(method_select).select_by_value("DELETE")

    send_button = browser.find_element_by_id("submit-request")
    send_button.click()
    
    code_data_value = get_codemirror_value(browser)

    if code_data_value.find("delete") > 0:
        print "test_delete_basic content test successful"
        return True
    else:
        print "test_delete_basic content test failed"
        return False

    return True


def test_head_basic(browser):
    set_url_field(browser, "http://httpbin.org/html")
    method_select = browser.find_element_by_id("request-method-selector")    
    Select(method_select).select_by_value("HEAD")
    send_button = browser.find_element_by_id("submit-request")
    send_button.click()
    code_data_value = get_codemirror_value(browser)

    if code_data_value.find("div") > 0:
        print "test_head_basic content test successful"
        return True
    else:
        print "test_head_basic content test failed"
        return False

def test_options_basic(browser):
    set_url_field(browser, "http://httpbin.org/html")
    method_select = browser.find_element_by_id("request-method-selector")    
    Select(method_select).select_by_value("OPTIONS")
    send_button = browser.find_element_by_id("submit-request")
    send_button.click()
    code_data_value = get_codemirror_value(browser)

    if code_data_value.find("div") > 0:
        print "test_options_basic content test successful"
        return True
    else:
        print "test_options_basic content test failed"
        return False

def test_post_basic(browser):
    set_url_field(browser, "http://httpbin.org/post")
    method_select = browser.find_element_by_id("request-method-selector")    
    Select(method_select).select_by_value("POST")
    send_button = browser.find_element_by_id("submit-request")
    send_button.click()
    code_data_value = get_codemirror_value(browser)

    if code_data_value.find("post") > 0:
        print "test_post_basic content test successful"
        return True
    else:
        print "test_post_basic content test failed"
        return False

def test_post_basic(browser):
    set_url_field(browser, "http://httpbin.org/post")
    method_select = browser.find_element_by_id("request-method-selector")    
    Select(method_select).select_by_value("POST")
    send_button = browser.find_element_by_id("submit-request")
    send_button.click()
    code_data_value = get_codemirror_value(browser)

    if code_data_value.find("post") > 0:
        print "test_post_basic content test successful"
        return True
    else:
        print "test_post_basic content test failed"
        return False

def test_put_basic(browser):
    set_url_field(browser, "http://httpbin.org/put")
    method_select = browser.find_element_by_id("request-method-selector")    
    Select(method_select).select_by_value("PUT")
    send_button = browser.find_element_by_id("submit-request")
    send_button.click()
    code_data_value = get_codemirror_value(browser)

    if code_data_value.find("put") > 0:
        print "test_put_basic content test successful"
        return True
    else:
        print "test_put_basic content test failed"
        return False

def main():
    s = service.Service('/Users/asthana/Documents/www/chromedriver')  # Optional argument, if not specified will search path.
    s.start()
    
    capabilities = {'chrome.switches': ["--load-extension=/Users/asthana/Documents/www/postman/POSTMan-Chrome-Extension/chrome"]}
    browser = webdriver.Remote(s.service_url, capabilities)
    
    load_postman(browser)
    test_title(browser)
    test_indexed_db(browser)
    test_get_basic(browser)
    test_delete_basic(browser)
    test_head_basic(browser)
    test_options_basic(browser)         
    test_post_basic(browser)
    test_put_basic(browser)

    browser.quit()

if __name__ == "__main__":
    main()
