# Thy runtime docs

 - [runtime API](api.md)
 - [Example: repl](example/repl.md)
 - [Example: server](example/server.md)
 - [Library utils](use-the-utils.md)

## What is this for

The aim of the project is to provide an easy and non opinionated container to develop `runtime interfaces`. That being a `CLI`, a `REPL` or something completely different. Thus far the interface is made of a command constructor and an event emitter. The approach is to consume commands in the same way one does on a terminal: line by line. The glue is made by associating commands to functions.

The command constructor supports aliasing and has 4 methods: set, get, config and parse. The event emitter job is to handle all flow control. Has input and output streams, 2 main events and 4 methods added to the [readline.Interface](nodejs.org/api/readline.html) prototype: lexer, parser, consumer and completer.

Only one use-case is and will be built in by default: a REPL. This REPL can be transformed on a CLI with ease.

## Show me the code

As a dumb example, this is how one would use `stdin` and `stdout` to make a REPL with a command that will create a server and another that will log the request url and the response status.

```js
'use strict';

var http = require('http');
var runtime = require('runtime')
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
  runtime.output.write('\n');
  console.log('req.url = %s', req.url);
  console.log('res.statusCode = %s', res.statusCode);
});

// we'll call this after the server is created
runtime.set('server on port', function(argv, args){
  // take the argument passed by next on `createServer`
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

// All set! We'll emit a non defined command
// so it will end up in the `rootHandle` set previously
runtime.emit('next', 'start');
```

As you can see there was no necessity to create any layer to dispatch, resolve not found commands or anything. All we are doing here is associate functions with object keys and be able to find those accordingly via their name.

Look at the [runtime API](api.md) to get more insight on how this works.
