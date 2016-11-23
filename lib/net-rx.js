require('colors')
var Rx = require('rx')
var net = require('net')
var jParse = require('../lib/json-stream')
var EE = require('events').EventEmitter

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

function fromNetServer(ss) {
    // Handle the data
    var observable = Rx.Observable.create (function (obs) {
        // Handle messages
        ss.on('data', data => {
          obs.onNext(data)
        })
        return () => ss.close()
    })

    var observer = Rx.Observer.create(function (event) {
      //if (socket.connected) {
      //    socket.emit(event.name, event.data);
      //}
    });

    return observable
    //return Rx.Subject.create(observer, observable);
}

var i = 0
var server = new Sok(7777)
var client = net.connect({ port: 7777 })

var srco = fromNetServer(server)

srco.filter(x => x % 2 === 0)
    .map(x => [ x, x[0] * 10 ])
    .subscribe(x => console.log('even'.grey, x))

srco.filter(x => x % 2 === 1)
    .map(x => [ x, x[0] * 10 ])
    .subscribe(x => console.log('odd'.yellow, x))

setInterval(() => {
  client.write(JSON.stringify([ i++ ]) + '\n')
}, 400)
