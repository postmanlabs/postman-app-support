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
	config_template = open('templates/config_template.js')
	s = config_template.read()
	config_template.close()
	template = Template(s)

	if web_url == "production":
		web_url_constant = 'POSTMAN_WEB_URL_PRODUCTION'
	else:
		web_url_constant = 'POSTMAN_WEB_URL_LOCAL'

	config_file = open("../chrome/js/config.js", "w")
	config_file.write(template.render(is_testing=is_testing, web_url=web_url_constant))
	config_file.close()

def main():
    parser = OptionParser(usage="Usage: %prog [options] filename")
    parser.add_option("-t", "--testing", dest="testing", help="is_testing flag")
    parser.add_option("-u", "--web_url", dest="web_url", help="(production/local)")

    (options, args) = parser.parse_args()

    generate_config_file(options.testing, options.web_url)


if __name__ == "__main__":
    main()