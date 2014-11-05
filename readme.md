## its runtime! [<img alt="progressed.io" src="http://progressed.io/bar/80" align="right"/>](https://github.com/fehmicansaglam/progressed.io)

[<img alt="build" src="http://img.shields.io/travis/stringparser/runtime/master.svg?style=flat-square" align="left"/>](https://travis-ci.org/stringparser/runtime/builds)
[<img alt="NPM version" src="http://img.shields.io/npm/v/runtime.svg?style=flat-square" align="right"/>](http://www.npmjs.org/package/runtime)
<br>

> Project parent of [gulp-runtime](https://github.com/stringparser/gulp-runtime). <br>
**implementation state**: young, chin hair started showing up.

The aim of the project is to provide an easy and non opinionated container to develop `runtime interfaces`. That being a `CLI`, `REPL`, `router` or something completely different.

On the [gulp-runtime repo](https://github.com/stringparser/gulp-runtime) I'm working on that `cli` feature for `gulp` so go check it out.

#### contents of readme

- [making a dumb logger](#making-a-dumb-http-logger)
- [install](#install)

## documentation

  For more information about the api see [the docs](docs).

## using this with [gulp](https://github.com/gulpjs/gulp)

```javascript
 // Your favourite gulpfile.js
 var runtime = new require('runtime').create('gulp', {
    input : process.stdin,
   output : process.stdout
 });
```
At runtime, when you want to see the prompt, press `enter`.

```bash
[13:07:50] Starting 'default'...
[13:07:50] Finished 'default' after 800 μs
 >
```

The prompt by itself does nothing, but if you wrote something

```js
runtime.set('today is', function(argv, args, next){
  if( argv[0] === 'friday' ){  next('friday');  }
});
runtime.set('friday', function(){
  console.log('Start dancing!')
});
```

Life changed
```shell
 > today is friday
Start dancing!
 >
```

Go to the [gulp-runtime](https://github.com/stringparser/gulp-runtime) repo if you don't want to use this from scratch.

## making a dumb http logger

A simple example that shows how is possible to redirect stuff to the next handler.

```js
var http = require('http');
var runtime = require('runtime')
  .create('http.createServer', {
     input : process.stdin,
    output : process.stdout
  });

runtime.config('port', 3000);

//
// ## rootNode: any non defined command will end up here
//
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
  // take the argument passed by next on `createServer`
  var port = args._.slice(-1)[0];
  console.log('\n server listening on port ' + port);
  console.log('\n run `curl http://localhost:' + port + '`');
  console.log(' in other terminal and come back');
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

// All set!
// We'll emit a non defined command
// so it will end up in the `rootHandle` set previously
runtime.emit('next', 'start');
```

## install

```
npm install runtime
```

## TODO
 - [ ] Review the command constructor
<hr>

[![NPM](https://nodei.co/npm/runtime.png?downloads=true)](https://nodei.co/npm/runtime/)

## License

[<img alt="LICENSE" src="http://img.shields.io/npm/l/gulp-runtime.svg?style=flat-square"/>](http://opensource.org/licenses/MIT)
