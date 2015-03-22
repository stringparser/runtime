
# documentation

**
[top-level API](#methods) -
[Stack API](./api/stack.md)
**

The `module.exports` two methods

- `create`: create a Runtime instance
- `Runtime`: the runtime constructor

`create`'s purpose is to be a key-value store for `Runtime` instances so you can use the same code in different modules without needing to do that yourself.

## Runtime([options])

_inherits from_ [Manifold][x-manifold]

_argument_ `options`, type object, are the properties be set at `runtime.store` on instantiation

_returns_ a runtime instance

_options_ properties default to
 - `options.log = true`, type boolean, wheter to log or not by default
 - `options.name = #root`, type string, label for the instance if cached

```js
var runtime = require('runtime').create(/*{name: '#root', log: true}*/);
```

## top-level API
### runtime.stack(...arguments[, props]) => [tick callback]
> constructs a consumable stack object which, upon call, will be used to
invoke and give context to `...arguments`

_...arguments_
- `string`, handlers set with `runtime.set(path, props)`
- `function`, to be invoke when the time comes

_props_
- type object, properties for the stack after instantiation.

_returns_
- a `tick` callback, which, upon call will execute the stack arguments

_depends on_ [async-done](http://github.com/phated/async-done) which is mainly used to trap errors in a domain and resolve completion for the usual async constructs we have today: _streams_, _Promises_ and _Observables_. _Callbacks_ are handled separately.

`app.stack` returns a function so composition is simply achieved by passing the returned callback as argument of the method.

```js
app.set('get :thing', function getThingHandle(){});
function one(){}
function two(){}
function three(){}

var tick = app.stack('get :thing', one, app.stack(two, app.stack(three)), {
  onHandle: function(next[, stackArguments]){
    // Each handle call and handle end
  },
  onHandleCall: function(next[, stackArguments]){
    // Just before each handle has been called
  },
  onHandleEnd: function(next[, stackArguments]){
    // When the handle has completed
  },
  onHandleError: function(error, next){
    // It can happen in two places for each stack:
    //  - once if the tick function was called with an error
    //  - any time an error happens
  },
  onHandleNotFound: function(next[, stackArguments]){
    // For string paths, since we are using regexes,
    // it can happen that either they are not defined
    // or the match wasn't complete
  }
});
```

By default all the elements of each stack will be run in parallel.

Read more about the [Stack api](#stak-api)

## runtime.repl([options])
> create a `repl` for the given runtime

This method uses the [readline](http://nodejs.org/api/readline.html) module to create a repl. It serves to make a REPL or CLI with the same ease.

_arguments_ options
- `input`, type stream, defaults to `process.stdin`
- `output`, type stream, defaults to `process.stdout`
- `completer`, type function, defaults to [built in completer][x-completer]

After its called, it will override the prototype
and become a property with a `readline` instance.

When the `readline` instance fires its `close` event, it restores the method to the prototype.

[x-manifold]: http://github.com/stringparser/manifold
[x-completer]: http://github.com/stringparser/runtime/tree/master/lib/completer.js

## Stack API

`app.stack` returns a callback. For each of those we should decide what to do with:
 - Errors
 - Context
 - Arguments
 - Completion
 - NotFounds
