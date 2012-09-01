from selenium import webdriver
import selenium.webdriver.chrome.service as service

def load_postman(browser):
    browser.get('chrome-extension://bgkigemnbmleogooeggblbgpphhhghoa/index.html')

def test_title(browser):
    assert "Postman" in browser.title

def main():
    s = service.Service('/Users/asthana/Documents/www/chromedriver')  # Optional argument, if not specified will search path.
    s.start()
    
    capabilities = {'chrome.switches': ["--load-extension=/Users/asthana/Documents/www/POSTMan-Chrome-Extension/chrome"]}
    browser = webdriver.Remote(s.service_url, capabilities)
    
    load_postman(browser)
    test_title(browser)

    browser.quit()

if __name__ == "__main__":
    main()
