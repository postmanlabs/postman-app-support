import argparse
import shutil
import os
import sys
import time
import requests
import json
from colorama import deinit
from pprint import pprint

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

def execute_formdata_request(request, destination_dir):
	print "Execute formdata request"
	return []

def execute_urlencoded_request(request, destination_dir):
	print "Execute urlencoded request"
	return []

def execute_raw_request(request, destination_dir):
	print "Execute raw request"
	return []
	
def execute_request(request, destination_dir):
	print "Running request %s" % request['name']
	dataMode = request['dataMode']	

	if dataMode == "params":
		response = execute_formdata_request(request, destination_dir)
	elif dataMode == "urlencoded":		
		response = execute_urlencoded_request(request, destination_dir)
	elif dataMode == "raw":
		response = execute_raw_request(request, destination_dir)

	return response

def write_result(responses, destination_dir):
	print "Writing result file"
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