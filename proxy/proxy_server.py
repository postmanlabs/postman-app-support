from twisted.web import proxy, http
from twisted.internet import reactor
from twisted.python import log
import sys
log.startLogging(sys.stdout)
 
class ProxyFactory(http.HTTPFactory):
    protocol = proxy.Proxy
 
reactor.listenTCP(8080, ProxyFactory())
reactor.run()