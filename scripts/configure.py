# Configure Postman for testing or production
import os
import os.path, time
import string
import json
import shutil
import PIL
from optparse import OptionParser
from datetime import datetime
from jinja2 import Environment, PackageLoader, Template

def generate_config_file(is_testing, web_url):
	config_template = open('../chrome/js/config_template.js')
	s = config_template.read()
	config_template.close()
	template = Template(s)

	if web_url == "production":
		web_url_constant = 'POSTMAN_WEB_URL_PRODUCTION'
	elif web_url == "staging":
		web_url_constant = 'POSTMAN_WEB_URL_STAGING'
	else:
		web_url_constant = 'POSTMAN_WEB_URL_LOCAL'

	config_file = open("../chrome/js/config.js", "w")
	config_file.write(template.render(is_testing=is_testing, web_url=web_url_constant))
	config_file.close()

def generate_background_file(is_testing):
	background_template = open('../chrome/background_template.js')
	s = background_template.read()
	background_template.close()
	template = Template(s)

	if is_testing == 'true':
		file_name = 'tester.html'
	else:
		file_name = 'requester.html'

	background_file = open("../chrome/background.js", "w")
	background_file.write(template.render(file_name=file_name))
	background_file.close()

def main():
    parser = OptionParser(usage="Usage: %prog [options] filename")
    parser.add_option("-t", "--testing", dest="testing", help="is_testing flag")
    parser.add_option("-u", "--web_url", dest="web_url", help="(production/local)")

    (options, args) = parser.parse_args()

    testing = options.testing
    web_url = options.web_url

    generate_config_file(testing, web_url)
    generate_background_file(options.testing)


if __name__ == "__main__":
    main()