'use strict';

var http = require('http');
var runtime = require('../')
  .create('http.createServer', {
     input : process.stdin,
    output : process.stdout
  });

runtime.config('port', 3000);

// any non defined command will end up here
runtime.set(function rootHandle(argv){
  if( argv[0] ){
    console.log(' (press tab to see completion)');
    console.log(' type `createServer` <port> to create a server');
    console.log(' Note: default port is', this.config('port'));
  }
  this.prompt();
});

// the dummest logger ever made
runtime.set('logger', function loggerHandle(req, res){
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello there\n');
  runtime.output.write('------\n');
  console.log('req.url = %s', req.url);
  console.log('res.statusCode = %s', res.statusCode);
});

// we'll call this after the server is created
runtime.set('server on port', function(argv, args){
  var port = args._.slice(-1)[0];
  console.log('\n server listening on port ' + port);
  console.log('\n run `curl http://localhost:' + port + '`');
  console.log(' on another terminal and come back here to see whats going on');
  console.log();
});

var server;
// lets do that server
runtime.set('createServer', function(argv, args, next){
  var port = this.config('port');
  var logger = this.get('logger').handle;
  if(!server){
    port = parseInt(args._[1]) || port;
    this.config('port', port);
    server = http.createServer(logger)
      .listen(port, function(){
        next('server on port ' + port);
      });
  } else {
    port = this.config('port');
    this.output.write('already a server running on port '+port);
  }
});

// All set! I'll emit a non defined command
// so it will end up in the `rootHandle` set previously
runtime.emit('next', 'start');
