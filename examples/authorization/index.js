'use strict';

//
// Require all dependencies.
//
var authorize = require('./authorize')
  , bodyParser = require('body-parser')
  , express = require('express')
  , http = require('http')
  , Primus = require('primus')
  , routes = require('./routes');

//
// Create an Express application.
//
var app = express();

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

app.post('/login', routes.login);

//
// Create an HTTP server and our Primus server.
//
var server = http.createServer(app)
  , primus = new Primus(server);


primus.save('./examples/authorization/public/js/primus-lib.js' , function save(err) {
  console.log (" index.js > saved = ");
})



primus.on('outgoing::open', function () {
  primus.socket.on('unexpected-response', function (req, res) {
    console.error(res.statusCode);
    console.error(res.headers['www-authenticate']);

    //
    // It's up to us to close the request (although it will time out).
    //
    req.abort();

    //
    // It's also up to us to emit an error so primus can clean up.
    //
    primus.socket.emit('error', 'authorization failed: ' + res.statusCode);
  });
});



//
// Add the authorization hook.
//
primus.authorize(function (req, done) {
  return done({ statusCode: 403, message: 'Go away!' });
});


//
// `connection` is only triggered if the authorization succeeded.
//
primus.on('connection', function connection(spark) {

  console.log (" index.js >  = CONNECTED " );
  spark.on('data', function received(data) {
    console.log(spark.id, 'received message:', data);

    //
    // Echo back to the client any received data.
    //
    spark.write(data);
  });
});

//
// Begin accepting connections.
//
server.listen(8080, function listening() {
  console.log('Open http://localhost:8080 in your browser');
});
