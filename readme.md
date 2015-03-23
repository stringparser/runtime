## runtime [![build][badge-build]][x-travis][![NPM version][badge-version]][x-npm]

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/stringparser/runtime?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge) -
[documentation](./docs) -
[examples](#examples) -
[install](#install) -
[implementation status](#implementation-status)

The aim of the project is to provide an easy an non opinionated container to develop `Runtime Interfaces`. For that, the main focus of the library is to abstract any **async function composition** into a single callback/function representing part of a stack.

In order to be pleasant a lot of work has been done for it to be simple. After that, though composing functions was good enough, in order to be expressive two features were added: path-to-regex mapping (to find functions from strings) and a little declarative API on top of the stack.

Only 5 methods to understand:
 `set`, `get`, `parse`, `stack` and `repl`.

Although maybe just with `set` and `stack` you can be done.

I may split the repl (based on [readline](http://nodejs.org/readline.html) and mainly because I want this to work the browser without too much overhead) into another module, but the others will stay.

Last, but not least, async completion for each handle is achieved using [async-done](http://github.com/phated/async-done) which supports _streams_, _promises_, _observables_ and _callbacks_. Though callbacks are handled separately, mainly because async-done wraps functions in a domain I error Handling is a big part here.

Anyway, enough babbling.

## sample

```js
var http = require('http');
var app = require('runtime').create();

app.set({
  onHandleNotFound: function(next, req, res){
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('404: There is no path \''+req.url+'\' defined yet.');
    next();
  }
});

app.set('get /', app.stack(index, query, end));

function index(next, req, res){
  res.write('Hello there ');
  return res;
}

function query(next, req, res){
  var name = req.url.match(/\?name=([^&]+)/);
  var user = name ? name[1] : '"anonymous"';
  res.write(user);
  return res;
}

function end(next, req, res){
  res.end(); next();
}

function router(req, res){
  var method = req.method.toLowerCase();
  app.stack(method + ' '+ req.url)(req, res);
}

http.createServer(router).listen(8000, function(){
  console.log('http server running on port 8000');
});
```

## documentation

Get started looking at [thy docs](./docs).

## examples

In the [examples](./examples) folder you can find some use-cases.

## install

With [npm][x-npm]

    npm install runtime --save

## implementation status
> growing a beard feels goood

The library needs polishing, much better documentation and examples. It has some rough edges I'm working on but is tested and usable. I want to fix some stuff I'm not really proud about, but the [top level API](./docs/api/runtime.md) should not suffer any change.

I'll be using it everywhere so the first user involved here is me.

> Meaning: I **do not** want to rewrite all again and again.

## license
[<img alt="LICENSE" src="http://img.shields.io/npm/l/gulp-runtime.svg?style=flat-square"/>](http://opensource.org/licenses/MIT)

[x-npm]: https://npmjs.org/package/runtime
[x-travis]: https://travis-ci.org/stringparser/runtime/builds
[badge-build]: http://img.shields.io/travis/stringparser/runtime/master.svg?style=flat-square
[badge-version]: http://img.shields.io/npm/v/runtime.svg?style=flat-square
