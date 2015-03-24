<p align="center">
  <img src="./docs/artwork/runtime_gear.png" height="245"/>
</p>

[documentation](./docs) -
[examples](#examples) -
[install](#install) -
[inspirated by](#inspirated-by) -
[implementation status](#implementation-status)

[![build][badge-build]][x-travis]
[![NPM version][badge-version]][x-npm]
[![Gitter][badge-gitter]][x-gitter]

The aim of the project is to provide an easy an non opinionated container to develop `Runtime Interfaces`. For that, the main focus of the library is to abstract any **async function composition** into a single callback/function representing part of a stack. Though composing functions was good enough, in order to be expressive two more features were added: [path-to-regex mapping][x-manifold] (to find functions from strings) and a little declarative API.

Last, but not least, async completion for each handle is achieved using [async-done](http://github.com/phated/async-done) which supports _streams_, _promises_, _observables_ and _callbacks_. Though callbacks are handled separately: to pass arguments around and take advantadge of error handling done  by async-done since it wraps functions in a domain.

Anyway, enough babbling.

## documentation

Get started looking at [thy docs](./docs).

## samples

#### server
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

#### query
```js
'use strict';

var mongodb = require('mongojs');
var db = mongodb('db', ['users']);
var app = require('../../.').create('mongo-example');

function remove(next){
  db.users.remove(next);
}

function count(next){
  db.users.count(next);
}

function insert(next, result, user){
  db.users.insert(user, next);
}

function find(next){
  db.users.find(next);
}

var query = app.stack(remove, count, insert, find, {
  wait: true,
  onHandleEnd: function(next){
    this.results = this.results || [ ];
    this.results.push({
      name: next.match,
      result: this.args.slice(1)
    });
    if(this.queue){ return ; }
    console.log('-------------');
    this.results.forEach(function(stack){
      console.log(stack.name);
      console.log(' ',stack.result[0], stack.result[1]);
    });
  }
});

query(null, {name: 'johnny'});
```

## more ex-samples

In the [examples](./examples) folder you can find some use-cases.

## install

With [npm][x-npm]

    npm install runtime --save

#### implementation status: unstable
> growing a beard feels goood

The library needs polishing. It has some rough edges I'm working on but is tested and usable. I want to fix some stuff I'm not really proud about, but the [top level API](./docs/api/runtime.md) should not suffer any change.

I'll be using it everywhere so the first user involved here is me.

## license
[![License][badge-license]][x-license]

<!--
  x-: is for just a link
  t-: is for doc's toc
-->

[x-npm]: https://npmjs.org/package/runtime
[x-travis]: https://travis-ci.org/stringparser/runtime/builds
[x-gitter]: https://gitter.im/stringparser/runtime
[x-license]: http://opensource.org/licenses/MIT

[x-manifold]: http://github.com/stringparser/manifold

[badge-build]: http://img.shields.io/travis/stringparser/runtime/master.svg?style=flat-square
[badge-gitter]: https://badges.gitter.im/Join%20Chat.svg
[badge-version]: http://img.shields.io/npm/v/runtime.svg?style=flat-square
[badge-license]: http://img.shields.io/npm/l/gulp-runtime.svg?style=flat-square
