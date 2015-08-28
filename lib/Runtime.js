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
  util.merge(this, util.type(props).plainObject);
}

/**
## stack

Maybe the only method you need to know after `Runtime.create`.
Composes asynchronous functions that resolve using a: `callback`, `stream`,
`promise` or `RxJs observable`. Its heavily based on what `gulp` is doing.
See `async-done` for more information on how async functions are resolved.

On the simplest case it only takes functions as arguments.
This can be changed easely to take any type if you gave
a `runtime.reduce` method for that instance when it was created.

Each `site` is given a calback **as a first argument** to be used when
the function is done. _The callback must be used_ or the _function should
return a promise, stream or RxJS observable.

Each `stack` is isolated from the other stacks so you can
do as many harm has you want without having to care much.

The way each `stack` interacts with another is passing arguments
only if the previous function was run in series.

### spec
```js
function runtime.stack(sites..., object props)
```

_arguments_
- `sites...`, type any, transformed with `runtime.reduce` to be functions
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
  var self = this;
  var funcs = util.reduce(arguments, self.reduce, [], self);
  var props = util.type(arguments[arguments.length-1]).plainObject;

  if(!funcs || !funcs.length){
    throw new Error('stack is empty, there are no functions in it');
  }

  composer.stack = new self.Stack(funcs);
  // ^ so the composer can be identified
  function composer(next, handle, host){
    var stack = util.merge(new self.Stack(funcs, true), props);
    if(handle === composer){ // we are inside other stack
      stack.host = host;
      stack.args = host.wait ? host.args : host.args.concat();
      stack.callback = next;
    } else {
      stack.host = false;
      stack.args = util.slice(arguments);
      stack.callback = typeof arguments[arguments.length-1] === 'function'
        ? stack.args.pop()
        : self.onHandleError;
    }
    stack.index = 0;
    stack.context = stack.context || self;
    return tick(stack);
  }

  // runs each handle
  function tick(stack){
    var handle = stack[stack.index];
    stack.next = ++stack.index < stack.length;
    var args = handle.stack && handle.stack instanceof self.Stack
      ? [next, handle, stack]
      : [next].concat(stack.args);

    util.asyncDone(function onNext(){
      next.wait = Boolean(stack.wait);
      self.onHandle(next, handle, stack);
      var result = handle.apply(stack.context, args);
      if(next.wait){ return result; }
      if(stack.next){ tick(stack); }
      if(stack.host.next){ tick(stack.host); }
      return result;
    }, next);

    function next(err){
      if(err instanceof Error){
        stack.callback.call(self, err, handle, stack);
        return self;
      } else if(next.wait && arguments.length){
        util.mapPush(stack.args, arguments, !err ? 1 : 0);
      }

      next.end = true; --stack.index;
      stack.splice(stack.indexOf(handle), 1);
      self.onHandle(next, handle, stack);

      if(stack.next){ return tick(stack); }
      if(stack.host.next){ tick(stack.host); }
      if(!stack.length){
        stack.callback.apply(self, [null].concat(stack.args));
      }
      return self;
    }

    return self;
  }

  return composer;
};

/**
## hooks

For the same instance, for each function that `runtime.stack` returns,
some methods can be used to inspect/maintain/catch errors for that instance.

Is your decision to make each instance independent or not.

### runtime.onHandle

Called two times: just before each `site` of the stack is run
and just after the handle has signaled its completion.

#### spec
```js
function runtime.onHandle(function next, function handle, object stack)
```

_arguments_
 - `next`, type function, the callback given to the handle
 - `handle`, type function, the function that will (or has been) called
 - `stack`, type object, the stack that is currently running

_returns_
 - the default funciton implemented is empty, so it returns `undefined`

### runtime.onHandleError

Called maybe one time: when there is an error when `composer` function
returned by `runtime.stack` did not take a function as a last argument.
If the `composer` function was run with a function as a last argument,
it is taken as a callback, and will receive the error as a first arguent.

#### spec
```js
function onHandle(Error error, function handle, Stack stack)
```

_arguments_
 - `error`, type error, the error that `handle` has raised
 - `handle`, type function, the function that threw the error
 - `stack`, type object, the stack that is currently running

_throws_
 - the default funciton throws the error, override it othewise
**/
Runtime.prototype.onHandle = function(){ };
Runtime.prototype.onHandleError = function(err){ throw err; };

/**
## runtime.reduce

Method called just after `runtime.stack` to prepare
the `sites...` to be composed. It should reduce the `sites...`
given to an array of functions so they can be called.

Same as `lodash.reduce`.

### spec
```js
fucntion runtime.reduce(previousSite, currentSite, sites)
```

_argumetns_
 - `previousSite`, type array the first time `runtime.reduce` is called
 - `currentSite`, type any the current site to be procesed
 - `sites`, type arguments, the arguments object given to `runtime.stack`

_returns_
 - **it should return an array of functions**
**/

Runtime.prototype.reduce = function(prev, curr){
  if(typeof curr === 'function'){ prev.push(curr); }
  return prev;
};

/**
## runtime.Stack

If you want to get fancy you can do even more things using
your own `Stack` instance. For that is what this method is given.

`runtime.stack` uses this method to compose functions
and indentify each `composer` function. Yikes, to create new `stack`
instances :)

If you have noticed, each `onWhatEver` hook has a `stack` object
given as last argument. The purpose of this is that you can provide
more instropection about what is going on on each stack.

To know more go to the `stack` API documentation
**/
Runtime.prototype.Stack = Stack;
