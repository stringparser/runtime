
# documentation

**
[top-level API](#methods) -
[Stack API](./api/stack.md)
**

The `module.exports` two methods

- `create`: create a Runtime instance
- `Runtime`: the runtime constructor

## create([name, options])

Key-value store for `Runtime` instances so you can use the same code in different modules without needing to do that yourself.

_arguments_
- `name`, type string, a label for the instance
- `options`, type object, options to be passed to the `Runtime` constructor.
 - `options.log`, type boolean, wether to log or not

_returns_
 - a new `Runtime` instance if wasn't there stored
 - a previous instance `name` if it did.

_defaults_
 - `name` to `#root`
 - `options.log` defaults to `true`

## Runtime([options])

_arguments_
  - `options`, type object, are the properties to be set at `runtime.store` on instantiation

_returns_
 - a runtime instance

_defaults_
 - `options.log = true`, type boolean, wheter to log or not by default
 - `options.name = #root`, type string, label for the instance if cached


The constructor _inherits from_ [Manifold][x-manifold]
  - [set(path[, props])][x-manifold-set], set a path-to-regexp with props for lookup
  - [get(path[, options])][x-manifold-get], get one of the path set with with its properties cloned
  - [parse(prop[, parser])][x-manifold-parse], parse properties before they are set

 Click on the links above for their corresponding documentation.

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

## stack API

So how does the library deal with _errors_, _context_, _arguments_, _completion_, _notFounds_ for each of the handles? Before it was said that

> `app.stack` returns a callback and constructs a consumable stack object which, upon call, will be used to invoke and give context to ...arguments


Well... the library by itself doesn't. It keeps an eye on the return value of each handle, gives a callback and adds a declarative API for you to use in each of the stacks you declare. But you are in charge.

<!--
  x-: is for just a link
  -->

[x-manifold]: http://github.com/stringparser/manifold

[x-manifold-set]: https://github.com/stringparser/manifold#manifoldsetpath-props

[x-manifold-get]: https://github.com/stringparser/manifold#manifoldgetpath-options-mod

[x-manifold-parse]: https://github.com/stringparser/manifold#manifoldparseprop-parser

[x-completer]: http://github.com/stringparser/runtime/tree/master/lib/completer.js
