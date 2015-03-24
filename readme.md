<p align="center">
  <img src="./docs/artwork/runtime_gear.png" height="245"/>
</p>

## [![build][b-build]][x-travis][![NPM version][b-version]][x-npm] [![Gitter][b-gitter]][x-gitter]

[getting started](#getting-started) -
[documentation](./docs) -
[examples](#examples) -
[implementation status](#implementation-status)

The aim of the project is to provide an easy an non opinionated container to develop `Runtime Interfaces` being the _main_ focus of the library to abstract async function composition into one function. In addition, and to make it expressive, some features were added:

 - [path-to-regex mapping][p-manifold]
 - a small declarative [Stack API][t-stack-api] for each stack
 - completion with a callback, always on the 1st argument, that is in charge of passing arguments down to other functions on the same stack. Completion using the return value with [async-done][p-async-done] that supports completion when returning a _stream_, _promise_ or an _observable_.

Changing from this

```js
handleOne(function(err, value){
  if(err){ throw err; }
  handleTwo(function (err, value2){
    // etc.
  })
})
```

to this

```js
var app = require('runtime').create();

function one(next, input){
  next(null, input, 'value');
}

function two(next, input, value){
  console.log(input, value);
  next();
}

var handle = app.stack(one, two, {
  wait: true
  onHandleNotFound: function(err, next){
    throw err;
  }
});

handle('input');
```

## getting started

Install `runtime` using [npm][x-npm]

    npm install runtime

and then require it into any module

```js
var app = require('runtime').create();

app.set(':handle', function(next){
  setTimeout(next, Math.random()*10);
})

app.stack('1 2 3 4 5 6')();
app.stack('one two three four five six', {wait: true})();
```

### browser

At the moment is not tested in browsers but it should work. Use it at your own risk though :). Either a browserify or webpack `bundle.js` should do the trick.

## documentation

[`module.exports`][t-module] - [Runtime API][t-runtime-api] - [Stack API][t-stack-api]

If you have something to ask, feel free to [open an issue][x-issues-new] or [come and chat in gitter][x-gitter] with any questions. I wouldn't mind at all.

## examples

There are some use cases you can find at [the examples directory](./examples).

## implementation status: unstable
> growing a beard feels goood

It's been a while since the project started and finally is getting there. At the moment, the library needs polishing since it has some rough edges I'm working. Is tested and usable but I want to fix some stuff I'm not really proud about. The [top level API][t-runtime-api] should not suffer any change.

I'll be using it everywhere so the first user involved here is me.

## license
[![License][b-license]][x-license]

<!--
  b-: is for badges
  p-: is for package
  t-: is for doc's toc
  x-: is for just a link
-->


[x-npm]: https://npmjs.org
[p-domain]: http://github.com/package/domain
[p-manifold]: http://npmjs.org/package/manifold
[p-next-tick]: http://npmjs.org/package/next-tick
[p-async-done]: http://npmjs.org/package/async-done

[t-docs]: ./docs
[t-module]: ./docs/module.md
[t-stack-api]: ./docs/stack.md
[t-runtime-api]: ./docs/runtime.md

[x-gitter]: https://gitter.im/stringparser/runtime
[x-travis]: https://travis-ci.org/stringparser/runtime/builds
[x-license]: http://opensource.org/licenses/MIT
[x-issues-new]: https://github.com/stringparser/runtime/issues/new

[b-build]: http://img.shields.io/travis/stringparser/runtime/master.svg?style=flat-square
[b-gitter]: https://badges.gitter.im/Join%20Chat.svg
[b-version]: http://img.shields.io/npm/v/runtime.svg?style=flat-square
[b-license]: http://img.shields.io/npm/l/gulp-runtime.svg?style=flat-square
