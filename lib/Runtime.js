'use strict';

var util = require('./util');
var Stack = require('./Stack');

exports = module.exports = Runtime;

/**
# Runtime API
**/
function Runtime(props){
  if(!(this instanceof Runtime)){
    return new Runtime(props);
  }

  if(props){ util.merge(this, props); }
}

/**
## runtime.stack

Maybe the only method you need to know after `Runtime.create`.

Composes asynchronous functions that resolve using a: `callback`, `stream`,
`promise` or `RxJS observable`.

Each `stack` is isolated from each other so you can
do as many harm has you want without having to care much.

The way each `stack` interacts with another is passing arguments.
Arguments are passed only if the previous function was run in series.

For the simplest case `runtime.stack` takes only functions as arguments,
but this can be changed with ease via `runtime.reduceStack`.

### spec
```js
function runtime.stack(sites..., object props)
```

Each `site` is given a calback **as a first argument** to be used when
the function is done. _The callback must be used_ or the _function should
return a `stream`, `promise` or `RxJS observable`_.

_arguments_
- `sites...`, type any, transformed with `runtime.reduceStack` to be functions
- `props`, type Object, properties for this stack

_returns_
- This method returns `composer` function for the `sites..` given.
- This function can take a callback as a last argument.
_ **You have to call it** to run the composed functions
_ Each call to this function is independent, so it can be reused.

_when_
- `props.wait` is `true`, the stack is run on series
- `props.wait` is `falsy`, the stack is run on parallel
- `props.context` is given, it will be used as `this` for each function
- `props.context` is not given, the `runtime` instance is used instead

_throws_
- when the given `sites` have no length, that is: when there is nothing to run

**/
Runtime.prototype.stack = function(/* functions..., props */){

  var ref = [].slice.call(arguments);
  var props = util.type(ref[ref.length-1]).plainObject && ref.pop() || {};
  var funcs = util.reduce(ref, this.reduceStack, [], this);

  if(!util.areFunctions(funcs)){
    throw new TypeError('stack is empty: there are no functions in it');
  }

  var self = this, length;
  composer.stack = new self.Stack(funcs, util.merge(props, self));

  function composer(next, site, host){
    var clone = composer.stack.clone();
    var stack = util.reduce(ref, self.reduceStack, clone, self);
    var sites = {next: 0, count: (length = stack.length)};

    if(site === composer){ // we are inside other stack
      stack.host = host;
      sites.done = next;
      stack.args = host.wait && host.args || host.args.concat();
      sites.onError = sites.onError || sites.done;
    } else {
      stack.args = [].slice.call(arguments);
      if(typeof arguments[arguments.length-1] === 'function'){
        sites.onError = sites.done = stack.args.pop();
      }
    }

    sites.context = stack.context || self;
    sites.onError = sites.onError || stack.onHandleError || self.onHandleError;
    sites.onHandle = stack.onHandle || self.onHandle;

    return tick(stack, sites);
  }

  // runs each handle
  function tick(stack, sites){
    var site = stack[sites.next];
    var args = site.stack instanceof self.Stack
      && [next, site, stack]
      || [next].concat(stack.args);

    next.wait = Boolean(stack.wait);
    sites.next = ++sites.next < length && sites.next;

    util.asyncDone(function callsite(){
      sites.onHandle.call(self, next, site, stack);
      var result = site.apply(sites.context, args);
      if(!next.wait && sites.next){ tick(stack, sites); }
      return result;
    }, next);

    var isDone = false;
    function next(err){
      if(isDone){ return self; }

      if(err instanceof Error){
        sites.onError.call(self, err, next, site, stack);
        return self;
      } else if(next.wait && arguments.length){
        util.map(stack.args, arguments, err ? -1 : 0);
      }

      isDone = true;
      stack.end = !(--sites.count);
      sites.onHandle.call(self, next, site, stack);
      if(sites.next){ return tick(stack, sites); }

      if(!sites.count && sites.done){
        sites.done.apply(self, [null].concat(stack.args));
      }

      return self;
    }

    return self;
  }

  return composer;
};

/**
## hooks

For the same instance each `composer` function that `runtime.stack` returns
will call two methods during the stack execution. These methods aim is to catch errors, inspect and maintain bookeeping if necesary.

### runtime.onHandle

Called at least one time, maybe two times per `site`:
- one just before each `site` of the stack is run
- another after the handle has signaled its completion

Maybe two times because the asynchronous function has to finish successfully for this method to be called twice.

#### spec
```js
function runtime.onHandle(function next, object stack)
```

_arguments_
 - `next`, type function, the callback given to the `handle`
 - `stack`, type object, the stack that is currently running

_returns_
 - the default funciton implemented is empty, so it returns `undefined`

### runtime.onHandleError

Called maybe one time:
 - when there is an error when `composer` function

The `composer` function returned by `runtime.stack` can take a callback
as a last argument. When there is no callback given `runtime.onHandleError`
is used instead.

#### spec
```js
function onHandleError(Error error, next, Function handle, Stack stack)
```

_arguments_
 - `error`, type error, the error that `handle` has raised
 - `handle`, type function, the function that threw the error
 - `stack`, type object, the stack that is currently running

_throws_
 - the default funciton throws the error, override it othewise
**/
Runtime.prototype.onHandle = function(){ };
Runtime.prototype.onHandleError = function(err){
  throw err;
};

/**
## runtime.reduceStack

Called in `runtime.stack` to prepare the `sites...` to be composed. Is an iterator, so it is called as many times as arguments were given to `runtime.stack`. Its job is to reduce them to an array of functions.

It works just like the callback given to `Array.prototype.reduce` with an empty array given as a second argument.

### spec
```js
fucntion runtime.reduceStack(stack, site, sites)
```

Should reduce `sites` to an array of functions not matter what their type was before.

_arguments_
 - `stack`, type array, empty array on the first call
 - `site`, type any, the current `site` to be map to a function
 - `sites`, type arguments, the arguments object given to `runtime.stack`

_return_
 - an array of functions
**/

Runtime.prototype.reduceStack = function(stack, site){
  if(typeof site === 'function'){ stack.push(site); }
  return stack;
};

/**
## runtime.Stack

You want to get fancy? You can do _even_ more things using
your own `Stack` constructor. Thats why this its here on the `Runtime.prototype`.

The basic job for this constructor is to identify `composer` functions.
But it could be used for more things. Actually, if you if you have noticed, each of the `hooks` has a `stack` object given as last argument. So using your own constructor, you can provide more information about what is going on.

For that you can to override `Runtime.prototype.Stack` either manually or using `Runtime.createClass`/`Runtime.extend`.
**/
Runtime.Stack = Runtime.prototype.Stack = Stack;
