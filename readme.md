# runtime [![NPM version][badge-version]][x-npm] [![downloads][badge-downloads]][x-npm]

[documentation](#documentation) -
[examples](#examples) -
[install](#install) -
[todo](#todo) -
[why](#why)

[![build][badge-build]][x-travis]

The aim of the project is to compose asynchronous functions and provide a basic api to create an interface around them. It is for people who hate so many choices around the same problem while wanting to pick and choose the right/prefered tool for the job at hand (i.e. callbacks, promises, streams, etc.).

Once these asynchronous functions are composed, they are not executed right away. Instead another function is returned leaving execution of this `stack` to the writer. This function can be used multiple times and does not maintain state.

Note that every function is made asynchronous and should be resolved either with a callback, returning a stream, a promise or with a [RxJS observable][RxJS-observable].

```js
var through = require('through2');
var Promise = require('es6-promise').Promise;

var runtime = Runtime.create({
  onHandle: function(next, handle, stack){
    if(!next.time){
      console.log('`%s` started', handle.name);
    } else {
      var diff = process.hrtime(next.time);
      console.log('`%s` ended after %s ms',
        handle.name || 'anonymous',
        (diff[0]*1e3 + diff[1]*1e-6).toString().match(/\d+\.\d{0,3}/)[0]
      );
    }

    next.time = process.hrtime();
  },
  onHandleError: function(error){
    console.log('ups something broke');
    throw error;
  }
});

function foo(next, value){
  console.log('received `%s`', value);
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

var fs = require('fs');

function baz(next, value){
  var stream = fs.createReadStream(__filename).pipe(
    through(
      function write(chunk, enc, cb){
        this.push(chunk);
        cb();
      },
      function end(cb){
        this.emit('end', value + 'Stream');
        cb();
      }
    )
  );

  return stream;
}

var composed = runtime.stack(foo, bar, baz, {wait: true});

composed('insert args here', function done(err, result){
  if(err){ return this.onHandleError(err); }
  console.log('result: `%s`', result);
});

// how does it look like?
console.log(
  'Stack tree -> %s',
  require('archy')(composed.stack.tree())
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

// create your class
var Registry = Runtime.createClass({
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
      stack.push(this.task[site]);
    }

    return stack;
  }
});

// instantiate
var myRuntime = new Registry();

// now you can use string and functions
myRuntime.task('one', function handleOne(next, myArg){
  // do async things
  next();
  // ^ or return a  promise, stream or RxJS observable
});

function two(next, myArg){
  // do async things
  next();
  // ^ or return a  promise, stream or RxJS observable
}

// now you can `stack` functions and string together
//
var stack = myRuntime.stack('one', two);

// run the `stack` function returned
//
stack('myArg', function onStackEnd(err, result){
  if(err){ throw err; }
  console.log(result);
});
```

### test

    npm test

```
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
      ✓ series: callback is run after all stacks are finished (56ms)
      ✓ passes arguments when host and completed stack waits
      ✓ does NOT pass arguments when stacks does NOT wait


  39 passing (273ms)
```

### todo

- [ ] make possible to rewind and repeat functions within the stack

### license

![LICENSE](http://img.shields.io/npm/l/runtime.svg?style=flat-square)

<!-- links -->

[x-npm]: https://npmjs.org/package/runtime
[x-travis]: https://travis-ci.org/stringparser/runtime/builds
[badge-build]: http://img.shields.io/travis/stringparser/runtime/master.svg?style=flat-square
[badge-version]: http://img.shields.io/npm/v/runtime.svg?style=flat-square
[badge-downloads]: http://img.shields.io/npm/dm/runtime.svg?style=flat-square

[RxJS-observable]: https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/observable.md
