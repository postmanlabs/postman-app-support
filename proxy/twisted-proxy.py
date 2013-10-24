#!/usr/bin/python
from twisted.internet import reactor
from twisted.web import http
from twisted.web.proxy import Proxy, ProxyRequest, ProxyClientFactory, ProxyClient
from ImageFile import Parser
from StringIO import StringIO

class InterceptingProxyClient(ProxyClient):
    def __init__(self, *args, **kwargs):
        ProxyClient.__init__(self, *args, **kwargs)
        self.image_parser = None

    def handleHeader(self, key, value):
        if key == "Content-Type" and value in ["image/jpeg", "image/gif", "image/png"]:
            self.image_parser = Parser()
        if key == "Content-Length" and self.image_parser:
            pass
        else:
            ProxyClient.handleHeader(self, key, value)

    def handleEndHeaders(self):
        if self.image_parser:
            pass #Need to calculate and send Content-Length first
        else:
            ProxyClient.handleEndHeaders(self)

    def handleResponsePart(self, buffer):
        if self.image_parser:
            self.image_parser.feed(buffer)
        else:
            ProxyClient.handleResponsePart(self, buffer)

    def handleResponseEnd(self):

        if self.image_parser:
            image = self.image_parser.close()
            try:
                format = image.format
                image = image.rotate(180)
                s = StringIO()
                image.save(s, format)
                buffer = s.getvalue()
            except:
                buffer = ""
            ProxyClient.handleHeader(self, "Content-Length", len(buffer))
            ProxyClient.handleEndHeaders(self)
            ProxyClient.handleResponsePart(self, buffer)
        ProxyClient.handleResponseEnd(self)

class InterceptingProxyClientFactory(ProxyClientFactory):
    protocol = InterceptingProxyClient

class InterceptingProxyRequest(ProxyRequest):
    protocols = {'http': InterceptingProxyClientFactory}

class InterceptingProxy(Proxy):
    requestFactory = InterceptingProxyRequest

factory = http.HTTPFactory()
factory.protocol = InterceptingProxy

print "Started proxy server"

reactor.listenTCP(8000, factory)
reactor.run()
