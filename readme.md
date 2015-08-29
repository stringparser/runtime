# runtime [![NPM version][badge-version]][x-npm] [![downloads][badge-downloads]][x-npm]

[documentation](#documentation) -
[examples](#examples) -
[install](#install) -
[todo](#todo) -
[why](#why)

[![build][badge-build]][x-travis]

The aim of the project is to compose asynchronous functions and provide basic tools to create an interface. It is for people who hate so many choices around the same problem while wanting to pick and choose the right/prefered tool for the job at hand (i.e. callbacks, promises, streams, etc.).

Once these asynchronous functions are composed, they are not executed right away. Instead another function is returned, leaving execution to the writer. This function can be used multiple times.

Note that every function is made asynchronous and should be resolved either with a callback, returning a stream or a promise.

```js
var Runtime = require('runtime');
var through = require('through2');
var Promise = require('es6-promise').Promise;

var runtime = Runtime.create({
  onHandleError: function(error){
    console.log('ups something broke');
    throw error;
  }
});

function foo(next, value){
  console.log(value);
  setTimeout(function(){
    next(null, 'Foo');
  }, Math.random()*10);
}

function bar(next, value){
  return new Promise(function(resolve){
    setTimeout(function(){
      resolve(value + 'Promise');
    }, Math.random()*10);
  });
}

function baz(next, value){
  var stream = through();

  setTimeout(function(){
    stream.end();
  }, Math.random()*10);

  return stream.once('end', function(){
    next(null, value + 'Stream');
  });
}

var barBaz = runtime.stack(bar, baz, {wait: true});

runtime.stack(foo, barBaz, {wait: true})('insert args here',
  function done(err, result){
    if(err){ return this.onHandleError(err); }
    console.log(result);
  }
);
```


## documentation

For the API docs and more examples you can go to the [docs folder](./docs)

## why

There are several ways to manage complexity of asynchronous functions,
ones are better than other for some use-cases and sometimes with callbacks
is more than enough. But we all want to avoid callback hell and reuse as much
as possible. Thats the main aim of this library.

## install

With [npm](http://npmjs.org)

    npm install --save runtime

## breaking changes

If you where using the previous version (0.9.x) the internals have been cleaned and simplified a lot to offer the same idea with less opinions and more reuse.

Now `runtime.stack` composes only functions **by default**. If you want to
give strings that then are mapped to a function that is, you want to write

```js
runtime.stack('foo', 'bar');
```
you will have to use the following approach

```js
var Runtime = require('runtime');

var runtime = Runtime.create({
  Stack: Runtime.Stack.createClass({
    set: function(name, handle){
      if(typeof handle === 'function'){
        this._store[name] = handle;
      }
      return this;
    },
    push: function(/* arguments */){
      if(!arguments.length){ return this; }
      [].forEach.call(arguments, function(site){
        if(typeof site === 'string' && this._store[site]){
          this.super.push.call(this, this._store[site]);
        } else {
          this.super.call(this, this._store[site]);
        }
      });
    }
  })
});
```

### test

    npm test

```
runtime
  exports
    ✓ create() should return a new instance
    ✓ createClass() should return a new constructor
    ✓ create(object props) should give the instance properties
    ✓ createClass(object mixin) mixin with new constructor
  stack-callbacks
    ✓ uses the callback when a fn throws
    ✓ uses the callback when passes the error
    ✓ passes error to onHandleError when no callback given
    ✓ runs the callback on completion
    ✓ runs fns in parallel by default
    ✓ {wait: true} should run functions in series
    ✓ passes arguments when fns wait
    ✓ does NOT pass arguments when fns does NOT wait
  stack-promises
    ✓ uses the callback when a promise throws
    ✓ uses the callback when promises rejects
    ✓ passes error to onHandleError if no callback was given
    ✓ runs the callback after completion of all promises
    ✓ runs in parallel by default
    ✓ runs in series with {wait: true}
    ✓ passes arguments when it waits
    ✓ does NOT pass arguments when fns does NOT wait
  stack-streams
    ✓ uses the callback when a stream throws an error
    ✓ uses the callback when a stream emits an error
    ✓ passes error to onHandleError if no callback was given
    ✓ runs the callback after completion of all streams
    ✓ runs in parallel by default
    ✓ runs in series with {wait: true}
  stacks-composed
    ✓ runs callback if fn throws from other stack
    ✓ runs callback if error given to next from other stack
    ✓ runs the callback on completion of all stacks
    ✓ runs stacks in parallel by default
    ✓ {wait: true} should run stacks in series
    ✓ passes arguments when host and completed stack waits
    ✓ does NOT pass arguments when stacks does NOT wait


33 passing (147ms)
```

### license

![LICENSE](http://img.shields.io/npm/l/runtime.svg?style=flat-square)

[x-npm]: https://npmjs.org/package/runtime
[x-travis]: https://travis-ci.org/stringparser/runtime/builds
[badge-build]: http://img.shields.io/travis/stringparser/runtime/master.svg?style=flat-square
[badge-version]: http://img.shields.io/npm/v/runtime.svg?style=flat-square
[badge-downloads]: http://img.shields.io/npm/dm/runtime.svg?style=flat-square
