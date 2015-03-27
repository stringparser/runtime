<p align="center">
  <img src="./docs/artwork/runtime_gear.png" height="245"/>
</p>

## [![build][b-build]][x-travis][![NPM version][b-version]][p-runtime] [![Gitter][b-gitter]][x-gitter]

[Getting started](#getting-started) -
[Documentation](./docs) -
[Examples](#examples) -
[Implementation status](#implementation-status) -
[License](#license)

The aim of the project is to provide an easy an non opinionated container to develop `Runtime Interfaces` being the _main_ focus of the library to abstract async function composition into one function. In addition, and to make it expressive, some features were added:

 - [path-to-regex mapping][p-manifold]
 - a small declarative [Stack API][t-stack-api] for each stack
 - completion with a callback, always on the 1st argument, that is in charge of passing arguments down to other functions on the same stack. Completion using the return value with [async-done][p-async-done] that supports completion when returning a _stream_, _promise_ or an _observable_.

## Samples

_series and/or parallel_
```js
var app = require('runtime').create();

function one(next){
  setTimeout(next, Math.random()*10);
}

function two(next){
  setTimeout(next, Math.random()*10);
}

var series = app.stack(one, two, {wait: true})
var parallel = app.stack(one, two);

series(); parallel();
```

_composition_
```js
var app = require('runtime').create();

function one(next){
  setTimeout(next, Math.random()*10);
}

function two(next){
  setTimeout(next, Math.random()*10);
}

var series = app.stack(one, two, {wait: true})
var composed = app.stack(one, two, series);

composed();
```

_separated control_
```js
var app = require('runtime').create();

function one(next){
  next.wait = false;
  setTimeout(next, Math.random()*10);
  // so the next doesn't have for this to end to start
}

function two(next){
  console.log(next.wait);
  // => true (instead of false as it was changed before)
  // each function is independent
  // honors the stack props given
  setTimeout(next, Math.random()*10);
}

var notEntirelySeries = app.stack(one, two, {wait: true})

notEntirely();
```

_lifecylce API_
```js
var app = require('runtime').create();

function one(next){
  throw new Error('something broke!');
}

function two(next){
  setTimeout(next, Math.random()*10);
}

var lifeCycle = app.stack(one, two, {
  wait: true,
  onHandleError: function(err, next){
    if(next.match === 'one' && err){
      // errors coming from function `one` are not relevant
      next();
    }
  },
  onHandleEnd: function(next){

  }
});

lifeCycle();
```

_argument passing_

arguments can be passed from one handle to another and are only shared within the same stack

```js
var app = require('runtime').create();

function one(next, arg1, arg2){
  console.log('%s %s', arg1, arg2); // => 1 2
  next(null, 2, 3);
}

function two(next, arg1, arg2){
  console.log('%s %s', arg1, arg2); // => 2 3
}

function three(next){
  console.log('%s %s', arg1, arg2); // => 1 2
}

var passingArgs = app.stack(one, two, app.stack(three));

passingArgs(1, 2);
```

_path to regexp support_
```js
var app = require('runtime').create();

app.set(':method(get|post) /user/:page(\\d+)', function(next){
  next();
});

app.get('post /user/10'); // =>
{
  notFound: false,
  path: 'post /user/10',
  url: '/user/10',
  match: 'post /user/10',
  params: {
    _: ['method', 'page'],
    method: 'get',
    page: '10'
  }
}
```

_simple server using the `http` module_

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


## Getting started

Install `runtime` using [npm][x-npm]

    npm install runtime

and then require it into a module

```js
var app = require('runtime').create();

app.set(':handle', function(next){
  setTimeout(next, Math.random()*10);
})

app.stack('1 2 3 4 5 6')();
app.stack('one two three four five six', {wait: true})();
```

## Browser

At the moment is not tested in browsers but it should work. Use it at your own risk though :). Either a browserify or webpack `bundle.js` should do the trick.

## Documentation

[`module.exports`][t-module] - [Runtime API][t-runtime-api] - [Stack API][t-stack-api]

If you have something to ask, feel free to [open an issue][x-issues-new] or [come and chat in gitter][x-gitter] with any questions. I wouldn't mind at all.

## Examples

There are some use cases you can find at [the examples directory](./examples).

## Implementation status
> growing a beard feels goood

    status: unstable

It's been a while since the project started and finally is getting there. At the moment, the library needs polishing since it has some rough edges I'm working on. Is tested and usable but I want to fix some stuff I'm not really proud about. In any case, the [top level API][t-runtime-api] should not suffer any change.

I'll be using it everywhere so the first user involved here is me.

## License
[![License][b-license]][x-license]

<!--
  b-: is for badges
  p-: is for package
  t-: is for doc's toc
  x-: is for just a link
-->


[x-npm]: https://npmjs.org
[p-domain]: http://github.com/package/domain
[p-runtime]: http://npmjs.org/package/runtime
[p-manifold]: http://npmjs.org/package/manifold
[p-next-tick]: http://npmjs.org/package/next-tick
[p-async-done]: http://npmjs.org/package/async-done

[t-docs]: ./docs
[t-module]: ./docs/module.md
[t-stack-api]: ./docs/stack-api.md
[t-runtime-api]: ./docs/runtime-api.md

[x-gitter]: https://gitter.im/stringparser/runtime
[x-travis]: https://travis-ci.org/stringparser/runtime/builds
[x-license]: http://opensource.org/licenses/MIT
[x-issues-new]: https://github.com/stringparser/runtime/issues/new

[b-build]: http://img.shields.io/travis/stringparser/runtime/master.svg?style=flat-square
[b-gitter]: https://badges.gitter.im/Join%20Chat.svg
[b-version]: http://img.shields.io/npm/v/runtime.svg?style=flat-square
[b-license]: http://img.shields.io/npm/l/gulp-runtime.svg?style=flat-square
