var dbug = require('debug')('okc:json-stream')
var thru = require('through')

module.exports = function(sock) {
  var chunk = ''
  var d_index, json, str;

  sock.setEncoding('utf8')

  var tr  = thru(function(data) {
    chunk += data
    d_index = chunk.indexOf('\n')

    while (d_index > -1) {
      try {
        str = chunk.substring(0,d_index)
        json = JSON.parse(str)
        this.queue(json)
      } catch(err) {
        this.emit('error', err)
      }
      chunk = chunk.substring(d_index+1)
      d_index = chunk.indexOf('\n')
    }
  })

  sock.pipe(tr)
  return tr
}
