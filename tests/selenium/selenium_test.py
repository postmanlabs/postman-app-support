from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support.select import Select
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import selenium.webdriver.chrome.service as service
import inspect
import time
import imp
import os
from colorama import deinit
MODULE_EXTENSIONS = ('.py', '.pyc', '.pyo')

def package_contents(package_name):
    file, pathname, description = imp.find_module(package_name)
    if file:
        raise ImportError('Not a package: %r', package_name)
    # Use a set because some may be both source and compiled.
    return set([os.path.splitext(module)[0]
        for module in os.listdir(pathname)
        if module.endswith(MODULE_EXTENSIONS)])

def run_all():
    print "Start running tests\n"
    modules = package_contents("pmtests")
    
    # Runs all tests on import
    for module in modules:
        __import__("pmtests." + module)

def run():
    from pmtests.postman_tests_requests import PostmanTestsRequests
    
def main():
    run()
    deinit()

if __name__ == "__main__":
    main()
