## Runtime([options])

_arguments_
  - `options`, type object, are the properties to be set at `runtime.store` on instantiation

_returns_
 - a runtime instance

_defaults_
 - `options.log = true`, type boolean, wheter to log or not by default
 - `options.name = #root`, type string, label for the instance if cached


The constructor _inherits methods from_ [Manifold][x-manifold]
- [set(path[, props])][x-manifold-set], set a path-to-regexp with props for lookup
- [get(path[, options])][x-manifold-get], get one of the path set with with its properties cloned
- [parse(prop[, parser])][x-manifold-parse], parse properties before they are set

Click on the links above for their corresponding documentation.

## runtime API

```js
var runtime = require('runtime').create(/*{name: '#root', log: true}*/);
```

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

[x-manifold]: http://github.com/stringparser/manifold
[x-manifold-set]: [x-manifold]#manifoldsetpath-props
[x-manifold-get]: [x-manifold]#manifoldgetpath-options-mod
[x-manifold-parse]: [x-manifold]#manifoldparseprop-parser
