import argparse
import shutil
import os
import sys
import time
import requests
import json
import traceback
from colorama import deinit
from pprint import pprint

def is_method_with_body(method):
	methods_with_body = ["POST", "PUT", "PATCH", "DELETE"];
	if method in methods_with_body:
		return True
	else:
		return False

def is_valid_collection(collection):
	print "Collection: %s" % collection
	if not os.path.exists(collection):
		print "Collection does not exist"
		return False
	else:
		return True

def is_valid_environment(environment):
	print "Environment: %s" % environment

	if not os.path.exists(environment):
		print "Environment does not exist"
		return False
	else:
		return True


def is_valid_destination(destination):
	print "Destination %s" % destination

	if not os.path.exists(destination):
		print "Creating directory"
		os.makedirs(destination)

	return True

def get_headers(header_string):
	headers = {}

	if not header_string:
		return headers

	hs = header_string.split("\n")
	pprint(hs)

	for header in hs:		
		h = header.split(":")
		if len(h) > 1:
			key = h[0].strip().lower()
			value = h[1].strip()
			headers[key] = value
				
	return headers

def save_response(request, data, destination_dir):	
	name = request['name']
	name = name.replace('/', '_')
	file_name = os.path.join(destination_dir, name)
	f = open(file_name, 'w+')
	f.write(data)
	f.close()

def get_formdata_for_requests(data):
	body = {}
	for kvpair in data:
		if kvpair['type'] == 'text':
			body[kvpair['key']] = kvpair['value']

	return body

def get_urlencoded_for_requests(data):
	body = ""
	for kvpair in data:
		body = body + kvpair['key'] + "=" + kvpair['value'] + "&"

	body = body[:-1]

	return body

def execute_request(request, destination_dir):	
	print "\n**********"
	print request['name']
	response = {
		'request': {
			'name': request['name'],
			'url': request['url'],
			'method': request['method']
		},
		'status_code': 0,
		'success': False
	}

	url = request['url']
	method = request['method'].upper()
	headers = get_headers(request['headers'])
	dataMode = request['dataMode']
	executed = False

	if is_method_with_body(method):
		has_body = True
		if dataMode == 'params':
			body = get_formdata_for_requests(request['data'])
		elif dataMode == 'urlencoded':			
			headers['content-type'] = "application/x-www-form-urlencoded";
			body = get_urlencoded_for_requests(request['data'])			
		elif dataMode == 'raw':
			body = request['data']
	else:
		has_body = False

	if method == 'GET':		
		try:
			r = requests.get(url, headers=headers)
			executed = True
			save_response(request, r.text, destination_dir)
			response['status_code'] = r.status_code
			response['success'] = True
		except Exception as e:			
			traceback.print_exc()
			executed = True
			response['success'] = False
	elif method == 'POST':
		try:
			print headers
			r = requests.post(url, headers=headers, data=body)
			executed = True
			save_response(request, r.text, destination_dir)
			response['status_code'] = r.status_code
			response['success'] = True
		except Exception as e:			
			traceback.print_exc()
			executed = True
			response['success'] = False
	elif method == 'PUT':
		try:
			r = requests.put(url, headers=headers, data=body)
			executed = True
			save_response(request, r.text, destination_dir)
			response['status_code'] = r.status_code
			response['success'] = True
		except Exception as e:			
			traceback.print_exc()
			executed = True
			response['success'] = False
	elif method == 'DELETE':
		try:
			r = requests.delete(url, headers=headers, data=body)
			executed = True
			save_response(request, r.text, destination_dir)
			response['status_code'] = r.status_code
			response['success'] = True
		except Exception as e:			
			traceback.print_exc()
			executed = True
			response['success'] = False
	elif method == 'HEAD':
		try:
			r = requests.head(url, headers=headers)
			executed = True
			save_response(request, json.dumps(r.headers, ensure_ascii=False), destination_dir)
			response['status_code'] = r.status_code
			response['success'] = True
		except Exception as e:			
			traceback.print_exc()
			executed = True
			response['success'] = False
	elif method == 'OPTIONS':
		try:
			r = requests.options(url, headers=headers)
			executed = True
			save_response(request, r.text, destination_dir)
			response['status_code'] = r.status_code
			response['success'] = True
		except Exception as e:			
			traceback.print_exc()
			executed = True
			response['success'] = False
	else:
		print "Method %s not supported" % method

	return response

def write_result(responses, destination_dir):
	print "Writing result file"
	# TODO Write JSON file here
	pprint(responses)

def execute_requests(requests, destination_dir):
	print "Executing %d requests" % len(requests)
	responses = []

	for request in requests:
		response = execute_request(request, destination_dir)
		responses.append(response)

	write_result(responses, destination_dir)

def run_collection(collection_file, environment_file, destination_dir):
	if not is_valid_collection(collection_file):
		return False

	if not is_valid_destination(destination_dir):
		return False

	if environment_file:
		if not is_valid_environment(environment_file):
			return False	

	f = open(collection_file)
	collection = json.load(f)
	f.close()

	print "Everything in order. Running collection %s..." % collection['name']

	requests = collection['requests']

	execute_requests(requests, destination_dir)

	print "Finished running collection."	
	# pprint(collection)

def main():
    parser = argparse.ArgumentParser(description="Postman collection runner")
    parser.add_argument("-c", "--collection", dest="collection", help="Collection that you want to run")
    parser.add_argument("-e", "--environment", dest="environment", help="Environment to be used")
    parser.add_argument("-d", "--destination", dest="destination", help="Directoy to save result and responses to")

    options = parser.parse_args()

    if options.destination:
        destination = os.path.join(os.getcwd(), options.destination)
    else:
        destination = os.getcwd()

    collection = options.collection
    environment = options.environment

    run_collection(collection, environment, destination)

if __name__ == "__main__":
    main()