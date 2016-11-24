require('colors')
var Rx = require('rx')
var Sok = require('../lib/sok')
var net = require('net')

var i = 0
var server = new Sok(7777)
var client = net.connect({ port: 7777 })

var srco = fromNetServer(server)

srco.filter(x => x % 2 === 0)
    .map(x => [ x, x[0] * 10 ])
    .subscribe(x => console.log('even'.grey, x[0]))

srco.filter(x => x % 2 === 1)
    .map(x => [ x, x[0] * 10 ])
    .subscribe(x => console.log('odd'.yellow, x[0]))

setInterval(() => {
  client.write(JSON.stringify([ i++ ]) + '\n')
}, 400)

function fromNetServer(server) {
  var observable = Rx.Observable.create ( obs => {
      server.on('data', data => obs.onNext(data) )
      return () => server.close()
  })
  return observable
}
