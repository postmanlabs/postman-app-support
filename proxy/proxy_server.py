#!/usr/bin/python
from twisted.internet import reactor
from twisted.web import http
from twisted.web.proxy import Proxy, ProxyRequest, ProxyClientFactory, ProxyClient

class InterceptingProxyClient(ProxyClient):
    def __init__(self, *args, **kwargs):
        ProxyClient.__init__(self, *args, **kwargs)
        self.overrides = []
        self.restricted_headers = [
            'accept-charset',
            'accept-encoding',
            'access-control-request-headers',
            'access-control-request-method',
            'connection',
            'content-length',
            'cookie',
            'cookie2',
            'content-transfer-encoding',
            'date',
            'expect',
            'host',
            'keep-alive',
            'origin',
            'referer',
            'te',
            'trailer',
            'transfer-encoding',
            'upgrade',
            'user-agent',
            'via'
            ]

        self.all_headers = []
        self.unsent_restricted_headers = []

    def sendHeader(self, name, value):
        if "postman-" in name:
            new_header = name[8:]
            print "Header %s, %s, %s" % (name, value, new_header)
            name = new_header
            header = {
                "name": name,
                "value": value
                }

            self.all_headers.append(name)
            ProxyClient.sendHeader(self, name, value)
        elif name in self.restricted_headers:
            header = {
                "name": name,
                "value": value
                }
            print "Restricted header %s" % name
            self.unsent_restricted_headers.append(header)
        else:
            ProxyClient.sendHeader(self, name, value)

    def endHeaders(self):
        for header in self.unsent_restricted_headers:
            if not header["name"] in self.all_headers:
                ProxyClient.sendHeader(self, header["name"], header["value"])
        ProxyClient.endHeaders(self)

    def handleHeader(self, key, value):
        # change response header here
        print("Header: %s: %s" % (key, value))
        l = key.lower()
        if l == "location":
            key = "Postman-Location"

        ProxyClient.handleHeader(self, key, value)

    def handleResponseEnd(self):
        if not self._finished:
            self.father.responseHeaders.setRawHeaders("client", ["location"])

        print "InterceptingProxyClient\n"
        print self.__dict__.keys()

        print "Headers"
        print self.headers # Gets all headers

        print "Data"
        print self.data # Gets all data

        print "InterceptingProxyClient father\n"
        print self.father.__dict__.keys()

        print "Uri %s" % self.father.uri
        print "Host %s" % self.father.host
        print "Path %s" % self.father.path
        print "Method %s" % self.father.method

        ProxyClient.handleResponseEnd(self)

class InterceptingProxyClientFactory(ProxyClientFactory):
    protocol = InterceptingProxyClient

class InterceptingProxyRequest(ProxyRequest):
    protocols = {'http': InterceptingProxyClientFactory, 'https': InterceptingProxyClientFactory}

class InterceptingProxy(Proxy):
    requestFactory = InterceptingProxyRequest

factory = http.HTTPFactory()
factory.protocol = InterceptingProxy

port = 8000

print "Listening on port %d" % port
reactor.listenTCP(8000, factory)
reactor.run()