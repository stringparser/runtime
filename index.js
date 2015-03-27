'use strict';

var util = require('./lib/util');

/* ## module.exports

The `module.exports` three properties

- `Runtime`: class representing a runtime Interface
- `create`: key-value store for `Runtime` instances
- `Stack`: class for consumable stack instances

> Note: on all that follows, `node` refers to an object mapping from a
 string (or path) via regular expressions. Being the `rootNode` that
for which no path was given.
*/

exports = module.exports = {
  Runtime: Runtime,
  create: create,
  Stack: Stack
};

/*
## create
```js
function create([string name, object options])
```

Key-value store for `Runtime` instances.

_arguments_
- `name` type string, name of the `Runtime` instance
- `options` type object, options to be passed to the `Runtime` constructor

_defaults_
 - `name` to random string
 - `options.log` defaults to `true`

_returns_
 - a `Runtime` instance
*/

function create(name, o){
  o = o || name;
  name = typeof name === 'string' && name;
  if(name && create.cache[name]){
    return create.cache[name];
  }

  name = name || Math.random().toString(32);
  create.cache[name] = new Runtime(o);

  return create.cache[name];
}
create.cache = {};

/* ## Runtime

```js
function Runtime([object options])
```

Class representing a `runtime` Interface.

_arguments_
 - `options` type object, properties to set for the `rootNode` of that instance

_returns_
 - a runtime instance

_defaults_
- `options.log = true`, type boolean, flags whether to log or not
- `options.name = #root`, type string, label for the instance

_Inherits from_ the [Manifold][x-manifold] class making it a key-value
store that can map strings to objects via regular expressions. The
store starts with a `rootNode` object at `instance.store` and builds
up all its children at `instance.store.children` in a flat manner.

For more information see the [Runtime API](./runtime.md).
*/

function Runtime(o){

  if( !(this instanceof Runtime) ){
    return new Runtime(o);
  }

  o = util.type(o).plainObject || {};
  util.Manifold.call(this);
  o.log = o.log === void 0 || o.log;
  this.set(o);
}
util.inherits(Runtime, util.Manifold);

/*
## runtime.stack
```js
function stack(...arguments[, object props])
```
On first call constructs a consumable stack object which will be used to
invoke and give context to its `...arguments`.

_arguments_
- `...arguments`, type string or function
- `props`, type object, properties of stack of the [stack API][t-stack].
 Look at its documentation for more details

_when_
 - an `...arguments` element is a string its handle will be obtained
from the corresponding `node` set using [`runtime.get`][t-runtime-get]

**_throws_**
 - when no arguments are given

_returns_
- a `tick` callback, which, upon call will execute the stack arguments
*/

Runtime.prototype.stack = function(stack){

  var stackArguments;
  var args, result, self = this;

  if(stack instanceof Stack){ tick(); }
  else if(arguments.length){
    stackArguments = arguments;
    tick.stack = new Stack(stackArguments);
    return tick;
  } else {
    throw new Error('cannot construct a stack without arguments');
  }

  function tick(arg){
    if(stackArguments){
      stack = new Stack(stackArguments, self);
      if(arg instanceof Stack){ stack.host = arg; }
      stack.args = util.args(arguments, stack.host ? 0 : -1);
      if(arg instanceof Error){ stack.onHandleError(arg, next); }
      return self.stack(stack);
    }

    next.wait = stack.wait || false;
    var stem = stack.match || stack.next;

    switch(typeof stem){
      case 'string':
        self.get(stem, next);
        next.match = next.match || next.path;
        next.handle = next.handle || stack.onHandleNotFound;
        stack.match = next.path.substring(next.match.length).trim();
      break;
      case 'function':
        if(typeof stem.path === 'string'){
          self.get(self.path, next);
          next.match = next.match || next.path;
        }
        next.handle = stem;
        next.match = next.match || stem.name || stem.displayName;
      break;
      default:
        throw new TypeError('argument should be `string` or `function`');
    }

    if(!stack.match){
      stack.next = stack.argv[++stack.index] || false;
    }

    if(stem.stack instanceof Stack){
      next.match = stem.stack.path;
      stack.args[0] = stack;
    } else {
      stack.args[0] = next;
    }

    args = util.args(stack.args);

    util.asyncDone(function(){
      stack.onHandle.apply(stack, args);
      stack.onHandleCall.apply(stack, args);
      result = next.handle.apply(stack.context, args);
      if(next.wait){ return result; }
      if(stack.next){
        self.stack(stack);
      } else if(stack.host && stack.host.next){
        self.stack(stack.host);
      }
      return result;
    }, next);
  }

  //
  // ---------
  //

  function next(err){
    if(err){ stack.onHandleError(err, next); }
    if(next.end) { return result; }
    if(arguments.length > 1){
      util.args.map(stack.args, arguments);
    }

    next.end = true;

    var that = stack;
    stack.queue = stack.queue.replace(next.match, '').trim();
    while(!that.queue && that.host){
      that.host.queue = that.host.queue.replace(that.path, '').trim();
      that = that.host;
    }

    stack.onHandle.apply(stack, args);
    stack.onHandleEnd.apply(stack, args);

    if(stack.next){
      self.stack(stack);
    } else if(stack.host && stack.host.next){
      stack.host.args = stack.args;
      self.stack(stack.host);
    }

    return result;
  }
};

/*
## runtime.repl
```js
function repl([object options])
```

Create a repl using the [readline][p-readline] node's module.

_arguments_ options with non mandatory props below
- `input`, type stream, defaults to process.stdin
- `output`, type stream, defaults to process.stdout
--
PD: this was the very beginning of it all :)
*/
Runtime.prototype.repl = function(o){
  var self = this; o = o || { };
  this.repl = require('readline').createInterface({
    input: util.type(o.input).stream && o.input || process.stdin,
    output: util.type(o.output).stream && o.output || process.stdout,
    completer: (typeof o.completer === 'function' && o.completer)
      || function defautlCompleter(line, callback){
        return util.completer(self, line, callback);
      }
  }).on('line', function(line){
    if(!line.trim()){ return this.prompt(); }
    self.stack(line)();
  }).once('close', function(){
    self.repl = Runtime.prototype.repl; // undo override
  }).once('SIGINT', function(){
    if(!this._sawReturn){
      this.output.write('\n');
    }
    this.output.write(new Date().toString() + '\n');
    process.exit(0);
  });

  this.repl.setPrompt((this.store.name || '') + '> ');
  return this;
};

/*
## Stack(app, args)
> construct a consumable `stack` object

arguments
- app, a `runtime` instance
- args, an `arguments` or `array` object

return
- stack instance

--
api.private
--
*/
function Stack(args, app){

  if(!(this instanceof Stack)){
    throw new SyntaxError('call Stack using `new`');
  } else if(args.length === 0){
    throw new TypeError('cannot construct a stack without arguments');
  }

  var opt = { }, argv = util.args(args);
  if(util.type(args[args.length-1]).plainObject){
    opt = argv.pop();
  }

  // form a string path for the stack
  // > useful for logging and other things
  var path = argv.reduce(function(prev, elem){
    var stem, type = typeof elem;
    if(!(/function|string/).test(type)){ // unsupported types
      throw new TypeError('argument should be `string` or `function`');
    }
    if(typeof elem === 'function'){
      stem = (elem.stack instanceof Stack && elem.stack.path)
        || elem.path || elem.name || elem.displayName;
    }
    stem = stem || elem;
    return prev ? prev + ' ' + stem : stem;
  }, '');

  if(!app){ this.path = path; return this; }

  app.get(argv[0].path || argv[0], opt);

  opt.onHandle = app.store.log
    ? util.type(opt.onHandle).function || this.onHandle
    : function logginDisabled(){};

  this.context = opt.context || this;
  Object.keys(opt).forEach(function(prop){
    if(this[prop] === void 0){
      this[prop] = opt[prop];
      return ;
    }
    var value = util.type(opt[prop]).function;
    if(typeof value === 'function'){
      this[prop] = value;
    }
  }, this);

  // invariants
  util.defineFrozenProp(this, 'path', path);
  this.queue = path;
  this.argv = argv;
  this.match = null;
  this.index = 0;
  this.next = argv[0];
  this.app = app;
  this.repl = !util.type(app.repl).function && app.repl;
}

/*
### stack.onHandle
```js
function onHandle(function next, ...stackArguments)
```

Called just before `onHandleCall` and before `onHandleEnd`.

_arguments_
 - `next` type function, callback passed to any of the functions of the stack
 - `stackArguments` type unknown, arguments passed down the stack

_defaults_
 - to a logger if the `rootNode` has a property `log` set to true

## Stack properties

The only thing that is shared between stacks are their arguments,
so properties can be safely attached to them and used without side effects.

Special properties are
 - `wait`: makes the next handle to wait for this to finish.

## Stack entry points

There are two entry points for the Stack API:
- through [runtime.set][t-runtime-set]
- through [runtime.stack][t-runtime-stack]
*/
Stack.prototype.onHandle = function(next){
  var path = next.match || next.path;
  var mode = this.wait ? 'series' : 'parallel';
  var time, status = next.time ? 'Finished' : 'Wait for';

  if(!this.time){
    var host = this.host ? 'from `'+this.host.path+'`' : '';
    console.log('Started `%s` in %s %s', this.path, mode, host);
    this.time = util.hrtime();
  } else {
    time = next.time ? 'in ' + util.prettyTime(process.hrtime(next.time)) : '';
    console.log('- %s `%s` %s', status, path, time);
  }

  if(!next.time){
    next.time = util.hrtime();
  }

  var self = this;
  while(self && !self.queue){
    time = util.prettyTime(process.hrtime(self.time));
    console.log('Stack `%s` taked %s', self.path, time);
    self = self.host;
  }

  if(this.repl && !self){ this.repl.prompt(); }
};

/*
### stack.onHandleError
```js
function onHandleError(Error error, function next)
```

Called when:
 - whenever an error occurs
 - the first argument of the function returned by `runtime.stack` is an error
 - the `next` callback passed to each element of the stack
 is called with a 1st argument that is not null

_arguments_
 - `error` type Error, passed to the stack
 - `next` type function, callback passed to any of the functions of the stack

_defaults_
 - to a function that throws the error
*/
Stack.prototype.onHandleError = function(err){
  if(err){ throw err; }
};

/*
### stack.onHandleCall
```js
function onHandleCall(function next, ...stackArguments)
```

Called just before a handle is run. The arguments are the same
passed to the corresponding handle afterwards.

_arguments_
 - `next` type function, callback passed to any of the functions of the stack
 - `stackArguments` type unknown, arguments passed down the stack

_defaults_
 - to an empty function
*/
Stack.prototype.onHandleCall = function(){};

/*
### stack.onHandleEnd
```js
function onHandleEnd(function next, ...stackArguments)
```

Called when `next` was called from the previous function of the stack.
 Or when the a stream, promise, observable is done
 (see [async-done][m-async-done]). The arguments are the same
 passed to the corresponding handle afterwards.

_arguments_
 - `next` type function, callback passed to any of the functions of the stack
 - `stackArguments` type unknown, arguments passed down the stack

_defaults_
 - to an empty function
*/
Stack.prototype.onHandleEnd = function(){};

/*
### stack.onHandleNotFound
```js
function onHandleNotFound(next, ...stackArguments)
```

Mainly used for missing function associated with a string to object
 mappings when [`runtime.get`][t-runtime-get] is called.

Called when:
- whenever the handle wasn't found

_arguments_
- `next` type function, callback passed to any of the functions of the stack
- `stackArguments` type unknown, arguments passed down the stack

_defaults_
- to a function throwing an error if `runtime.repl` is not active
- to a function that prints a warning when `runtime.repl` is active
*/
Stack.prototype.onHandleNotFound = function(next){
  var path = next.match || next.path;
  var message = 'no handle found for '+path+'`.\n'+
    'Set one with `runtime.set('+ (path ? '\'' + path + '\', ' : path) +
    '[Function])`';

  if(!this.repl){ throw new Error(message); }
  this.repl.input.write('Warning: '+message+'\n');
  this.repl.prompt();
};
