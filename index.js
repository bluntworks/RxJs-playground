var express = require('express')
var Ringpop = require('ringpop')
var TChannel = require('tchannel')

var host = '192.168.1.69'
var ports = [ 3000, 3001, 3002 ]

var bootsrapNodes = [
  '192.168.1.69:3000',
  '192.168.1.69:3001',
  '192.168.1.69:3002'
]

var cluster = ports.map(port => {
  var tcl = new TChannel()
  var scl = tcl.makeSubChannel({
    serviceName: 'ringpop',
    trace: false
  })

  return new Ringpop({
    app: 'moiApp',
    hostPort: host + ':' + port,
    channel: scl
  })
})

cluster.forEach(function each(rp, i) {
  rp.setupChannel()
  rp.channel.listen(ports[i], host, function onListen() {
    console.log('TChannel is listening on', ports[i])
    rp.bootsrap(bootsrapNodes, bootstrapCallback(rp, i))

    rp.on('request', forwardedCallback())
  })
})

var bootsLeft = bootsrapNodes.length

function bootstrapCallback(rp, i) {
  return function onBootstrap(err) {
    if(err) {
      console.log('botstrap error', err, rp.whoami())
      process.exit(1)
    }

    console.log('Ringpop', rp.whoami(), 'has bottsrapped')
    bootsLeft--

    if(bootsLeft === 0) {
      console.log('Ringpop Cluster is ready')
      createHttpServers()
    }
  }
}

function forwardedCallback() {
  return function onRequest(req, res) {
    res.end()
  }
}

function createHttpServers() {
  cluster.forEach((rp, i) => {
    var http = express()
    http.get('/objects/:id', function onReq(req, res) {
      var key = req.params.id
      if(rp.handleOrProxy(key, req, res)) {
        console.log('ringpop', rp.whoami(), 'handled key', key)
        res.end()
      } else {
        console.log('Ringpop', rp.whoami(), 'forwarded', key)
      }

      var port = ports[i] * 2
      http.listen(port, function onListen() {
        console.log('HTTP is listening', port)
      })
    })
  })
}
