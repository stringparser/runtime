'use strict';

var util = require('./lib/util');

/* ## top-level API

- create: create a Runtime instance
- Runtime: the runtime constructor
*/

exports = module.exports = {
  Runtime: Runtime,
  create: create,
  Stack: Stack
};

/*
## create([name, options])

Key-value store for `Runtime` instances.

_arguments_
- `options` type object, options to be passed to the `Runtime` constructor

_defaults_
 - `options.name`
 - `options.log` defaults to `true`

_returns_
 - a new `Runtime` instance if wasn't there stored
 - a previous instance `name` if it did
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

/* ## Runtime([options])

_inherits from_ [Manifold][x-manifold]

_argument_ `options`, type object, are
the properties be set at `runtime.store` on instantiation

_returns_ a runtime instance

_options_ properties default to
 - `options.log = true`, type boolean, wheter to log or not by default
 - `options.name = #root`, type string, label for the instance if cached

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
## Runtime.stack(...arguments[, props])
> constructs a consumable stack object which will be used to
call and give context to the registered handlers with runtime.set or
invoke functions given as an argument.

_...arguments_
- string, handlers set with runtime.set(path, props)
- function, to be invoke whe the time comes

-[, props]_
- properties to be added to the stack which may or may-not override methods
of the stack

_returns_
 - a `tick` function, which, upon call will execute the stack arguments
*/

Runtime.prototype.stack = function(stack){

  var stackArguments;
  var result, self = this;
  
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

    if(next.handle.stack instanceof Stack){
      next.match = next.handle.stack.path;
      stack.args[0] = stack;
    } else {
      stack.args[0] = next;
    }

    if(!stack.match){
      stack.next = stack.argv[++stack.index] || false;
    }

    util.asyncDone(function(){
      stack.onHandle.apply(stack, stack.args);
      stack.onHandleCall.apply(stack, stack.args);
      result = next.handle.apply(stack.context, stack.args);
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

    stack.onHandle.apply(stack, stack.args);
    stack.onHandleEnd.apply(stack, stack.args);

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
## Runtime.repl(options)
> create a repl for the given runtime

arguments: options with non mandatory props below
- input, repl's stream output, defaults to process.stdin
- output, repl's stream output, defaults to process.stdout

After its called, it will override the prototype
and becomes a property with a readline instance
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
## stack.onHandle(next)
> by default a logger

arguments
- next, callback function from the runtime.stack method

--
api.public
--
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
## stack.onHandleError(err, next)
> stack-wise error handler

arguments
- err, an Error instance
- next, callback function from the runtime.stack method

throws error

--
api.public
--
*/
Stack.prototype.onHandleError = function(err){
  if(err){ throw err; }
};

/*
## stack.onHandleCall(next)
> before handle

arguments
- next, callback function from the runtime.stack method

returns `undefined`

--
api.public
--
*/
Stack.prototype.onHandleCall = function(){};

/*
## stack.onHandleEnd(next)
> for stack start, before handle and after handle call

arguments
- next, callback function from the runtime.stack method

returns `undefined`

--
api.public
--
*/
Stack.prototype.onHandleEnd = function(){};

/*
## stack.onHandleNotFound(err, next)
> no handle was found

arguments
- err, an Error instance
- next, callback function from the runtime.stack method

throws error

--
api.public
--
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
