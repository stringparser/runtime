# runtime [![NPM version][badge-version]][x-npm]
[![Build status][badge-build]][x-travis]

[breaking changes](#breaking-changes) -
[documentation](#documentation) -
[examples](#examples) -
[install](#install) -
[todo](#todo) -
[why](#why)

The aim of the project is to compose asynchronous functions and provide a basic api to create an interface around them. It is for people who hate so many choices around the same problem while wanting to pick and choose the right/prefered tool for the job at hand (i.e. callbacks, promises, streams, etc.).

Once these asynchronous functions are composed, they are not executed right away. Instead another function is returned leaving execution of this `stack` to the writer. This function can be used multiple times and does not maintain state.

Note that every function is made asynchronous and should be resolved either with a callback, returning a stream, a promise or with a [RxJS observable][RxJS-observable].

## usage

As an example let's make 3 async functions. One using a callback, other returning a promise and another a stream.

```js
var through = require('through2');
var Promise = require('es6-promise').Promise;

var runtime = Runtime.create({
  reduceStack: function(stack, site){
    if(typeof site === 'function'){
      stack.push({
        fn: site,
        label: site.stack instanceof Runtime
          ? site.stack.tree().label
          : site.name
      });
    }
  },
  onHandle: function(site, stack){
    if(!site.time){
      console.log('`%s` started', site.label);
      site.time = process.hrtime();
    } else {
      var diff = process.hrtime(site.time);
      console.log('`%s` ended after %s ms',
        site.label, diff[0]*1e+3 + Math.floor(diff[1]*1e-6)
      );
    }
  },
  onHandleError: function(error){
    console.log('ups something broke');
    throw error;
  }
});

function foo(value, next){
  console.log('received `%s`', value);
  setTimeout(function(){
    next(null, 'Callback');
  }, Math.random()*10);
}

function bar(value, next){
  return new Promise(function(resolve){
    setTimeout(function(){
      resolve(value + 'Promise');
    }, Math.random()*10);
  });
}

var fs = require('fs');
function baz(value, next){
  var stream = fs.createReadStream(__filename);

  return stream.once('end', function(){
    next(null, value + 'Stream');
  });
}
```

Now let's compose those into one asynchronous function using
this brand new `runtime` instance we have created.

How does it look like?

The default goes like this: last argument is for options, all the others for functions.

```js
var composed = runtime.stack(foo, bar, baz, {wait: true});

composed('insert args here', function done(err, result){
  if(err){ return this.onHandleError(err); }
  console.log('result: `%s`', result);
});

// lets make it pretty
console.log('Stack tree -> %s',
  require('archy')(composed.stack.tree())
);
```

Here we go. This is the output logged.

```sh
Stack tree -> foo, bar, baz
├── foo
├── bar
└── baz

`foo` started
received `insert args here`
`foo` ended after 8 ms
`bar` started
`bar` ended after 3 ms
`baz` started
`baz` ended after 7 ms
result: `CallbackPromiseStream`
```

## documentation

Work in progress.

## why

There are several ways to manage complexity for asynchronous functions,
ones are better than others for some use-cases and sometimes with callbacks
is more than enough. But we all want to avoid callback hell and reuse as much
as possible.

## install

With [npm](http://npmjs.org)

    npm install --save runtime

## breaking changes

If you where using a previous version the internals have been cleaned and simplified a lot to offer the same idea with less opinions and more reuse.

Now `runtime.stack` composes only functions **by default**. If you want map strings to functions as in the following line

```js
var composed = runtime.stack('foo', 'bar');
```
you will have to use the following approach

```js
var Runtime = require('runtime');

// create your class
var RuntimeClass = Runtime.createClass({
  task: function(name, handle){
    if(typeof name !== 'string'){
      throw new TypeError('`name` should be a string');
    } else if(typeof handle !== 'function'){
      throw new TypeError('`handle` should be a function');
    } else if(!this.tasks){
      this.tasks = {};
    }

    this.task[name] = handle;
    return this;
  },
  // similar to Array.prototype.reduce with an empty array
  // given for the for the previous argument (stack = [] on first call)
  reduceStack: function(stack, site){
    if(typeof site === 'string' && typeof this.task[site] === 'function'){
      stack.push(this.task[site]);
    } else if(typeof site === 'function'){
      stack.push(site);
    }

    return stack; // this is optional
  }
});

// instantiate
var runtime = new RuntimeClass();

// now you can use strings and function
runtime.task('one', function handleOne(myArg, next){
  next(); // do async things or return a  promise, stream or RxJS observable
});

function two(myArg, next){
  next(); // or return a  promise, stream or RxJS observable
}

// now you can `stack` functions and string together
//
var composer = runtime.stack('one', two);

// run the `stack` function returned
//
composer('myArg', function onStackEnd(err, result){
  if(err){ throw err; }
  console.log(result);
});
```

### test

```
 ➜  runtime (master) ✔ npm test

runtime
   api
     ✓ onHandle is called before and after each site
     ✓ nested: onHandle is called before and after each site
     ✓ context for each stack can be given {context: [Object]}
     ✓ can be reused with no side-effects
     ✓ create({wait: true}) makes all stacks wait
   exports
     ✓ create() should return a new instance
     ✓ createClass() should return a new constructor
     ✓ create(object mixin) should add to the instance properties
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
     ✓ series: callback is run after all stacks are finished
     ✓ passes arguments when host and completed stack waits
     ✓ does NOT pass arguments when stacks does NOT wait


39 passing (244ms)
```

### license

![LICENSE](http://img.shields.io/npm/l/runtime.svg?style=flat-square)

<!-- links -->

[x-npm]: https://npmjs.org/package/runtime
[x-travis]: https://travis-ci.org/stringparser/runtime

[badge-build]: https://travis-ci.org/stringparser/runtime.svg
[badge-version]: https://badge.fury.io/js/runtime.svg

[RxJS-observable]: https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/observable.md
