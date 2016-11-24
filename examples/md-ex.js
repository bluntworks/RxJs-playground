var Ringpop = require('ringpop');
var TChannel = require('tchannel');

function Cluster(opts) {
    this.name = opts.name;
    this.size = opts.size;
    this.basePort = opts.basePort;
    this.bootstrapNodes = [];

    // Create the bootstrap list of nodes that'll
    // be used to seed Ringpop for its join request.
    for (var i = 0; i < this.size; i++) {
        this.bootstrapNodes.push('127.0.0.1:' + (this.basePort + i));
    }
}

Cluster.prototype.launch = function launch(callback) {
    var self = this;
    var done = after(self.size, callback);

    for (var i = 0; i < this.size; i++) {
        var addr = this.bootstrapNodes[i];
        var addrParts = addr.split(':');

        var tchannel = new TChannel();
        var ringpop = new Ringpop({
            app: this.name,
            hostPort: addr,
            channel: tchannel.makeSubChannel({
                serviceName: 'ringpop',
                trace: false
            })
        });
        ringpop.setupChannel();

        // First make sure TChannel is accepting connections.
        tchannel.listen(+addrParts[1], addrParts[0], listenCb(ringpop));
    }


    function listenCb(ringpop) {
        // When TChannel is listening, bootstrap Ringpop. It'll
        // try to join its friends in the bootstrap list.
        return function onListen() {
            ringpop.bootstrap(self.bootstrapNodes, done);
        };
    }
};

// IGNORE THIS! It's a little utility function that invokes
// a callback after a specified number of invocations
// of its shim.
function after(count, callback) {
    var countdown = count;

    return function shim(err) {
        if (typeof callback !== 'function') return;

        if (err) {
            callback(err);
            callback = null;
            return;
        }

        if (--countdown === 0) {
            callback();
            callback = null;
        }
    };
}

if (require.main === module) {
    // Launch a Ringpop cluster of arbitrary size.
    var cluster = new Cluster({
        name: 'mycluster',
        size: 2,
        basePort: 3000
    });

    // When all nodes have been bootstrapped, your
    // Ringpop cluster will be ready for use.
    cluster.launch(function onLaunch(err) {
        if (err) {
            console.error('Error: failed to launch cluster');
            process.exit(1);
        }

        console.log('Ringpop cluster is ready!');
    });
}
