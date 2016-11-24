var EE = require('events').EventEmitter
var jParse = require('../lib/json-stream')
var net = require('net')

function Sok(port) {
  EE.call(this)
  var self = this
  var connections = {}

  var server = net.createServer((sock) => {
    var rp = sock.remotePort

    if(!connections[rp]) {
      connections[rp] = sock
      self.emit('connect', sock)
    }

    sock.on('error', err => {
      self.emit('error', err)
      cleanup(rp)
    })

    sock.on('close', () =>  {
      self.emit('connection-closed', sock)
    })

    sock.on('end', () => {
      self.emit('connection-end', sock)
    })

    var parser = jParse(sock)
    parser.on('data', data => {
      self.emit('data', data, sock)
    })
  })

  function cleanup(rp) {
    delete connection[rp]
  }

  server.listen(port, () => console.log('listening on', port))
}

require('util').inherits(Sok, EE)

Sok.prototype.close = function() {
  console.log('Sok close called')
}

module.exports = Sok
