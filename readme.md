## runtime ![travis-build][travis-build]![npm version][npm-version]

[documentation](./docs/README.md) -
[examples](#examples) -
[install](#install) -
[implementation status](#implementation-status)

The aim of the project is to provide an easy an non opinionated container to develop `Runtime Interfaces`. For that, the main **focus** of the library is **async function composition** via common patterns such as path-to-regex handle mapping and async completion with _streams_, _promises_, _observables_ and _callbacks_.

Only 5 methods are included with each instance:
 `set`, `get`, `parse`, `stack` and `repl`.

## sample

```js
var http = require('http');
var app = require('runtime').create();

app.set('get /', app.stack(index, query, end));

function index(next, req, res){
  res.write('Hello there ');
  return res;
}

function query(next, req, res){
  var name = req.url.match(/\?name=([^&]+)/);
  var user = name ? '<i>' + name[1] + '</i>' : '"anonymous"';
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

app.set({
  onHandleCall: function(next, req, res){
    res.write('<!DOCTYPE html><html>');
  },
  onHandleNotFound: function(next, req, res){
    res.writeHead(404);
    res.end('404: There is no \''+req.url+'\' path defined yet.');
    next();
  },
  onHandleEnd: function(next, req, res){
    res.end('</html>');
  }
});

http.createServer(router).listen(8000, function(){
  console.log('http server running on port 8000');
});
```

## documentation

Getting started looking at [thy docs](./docs)

## examples

Go to the [examples](./examples) folder.

## install

With [npm][x-npm]

    npm install runtime --save

## implementation status
> growing a beard feels goood

The library needs polishing and much better documentation and examples. It has some rough edges I'm working on but is tested and more than usable. I want to make some changes for places I feel are pain points but the [top level API](./docs/api) should not suffer any change.

I'll be using it everywhere so the first user involved here is me.

> Meaning: I **do not** want to rewrite all again and again.

## license
[<img alt="LICENSE" src="http://img.shields.io/npm/l/gulp-runtime.svg?style=flat-square"/>](http://opensource.org/licenses/MIT)

[x-npm]: http://npmjs.org
[npm-version]: http://img.shields.io/npm/v/runtime.svg?style=flat-square
[travis-build]: http://img.shields.io/travis/stringparser/runtime/1.0.svg?style=flat-square
