'use strict';

var util = require('./lib/util');
var Stack = require('./lib/stack');

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
## create([options])

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

function create(o){
  o = o || {};
  o.name = util.type(o.name).string || '#root';
  if(!create.cache[o.name]){
    create.cache[o.name] = new Runtime(o);
  }
  return create.cache[o.name];
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

  o = o || {};
  util.Manifold.call(this);

  this.set({
    log: o.log === void 0 || o.log,
    name: util.type(o.name).string || '#root'
  });
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

  var self = this;
  var stackArguments;

  function next(err){
    if(err){ stack.onHandleError(err, next); }
    if(next.end) { return stack.args[0]; }
    if(arguments.length){
      util.args.map(stack.args, arguments);
    }

    next.end = true;
    stack.wait = next.wait;

    var that = stack;
    stack.queue = stack.queue.replace(next.match, '').trim();
    while(!that.queue && that.host){
      that.host.queue = that.host.queue.replace(that.path, '').trim();
      that = that.host;
    }

    stack.onHandle.apply(stack, next.args);
    stack.onHandleEnd.apply(stack, next.args);

    if(stack.next){
      self.stack(stack);
    } else if(stack.host && stack.host.next){
      stack.host.args = stack.args;
      self.stack(stack.host);
    }

    return next.result;
  }

  //
  // ---------
  //

  function tick(arg){
    if(stackArguments){
      stack = new Stack(stackArguments, self);
      if(arg instanceof Stack){ stack.host = arg; }
      stack.args = util.args(arguments, stack.host ? 0 : -1);
      if(arg instanceof Error){ stack.onHandleError(arg, next); }
      stack.time = util.hrtime();
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
      stack.next = stack.argv[++stack.index];
    }

    next.args = util.args(stack.args);
    stack.onHandle.apply(stack, next.args);
    stack.onHandleCall.apply(stack, next.args);

    util.asyncDone(function(){
      next.time = util.hrtime();
      var result = next.handle.apply(stack.context, next.args);
      if(next.wait){ return result; }
      if(stack.next){
        self.stack(stack);
      } else if(stack.host && stack.host.next){
        self.stack(stack.host);
      }
      return result;
    }, function(err){ next(err); });
  }

  if(stack instanceof Stack){ tick(); }
  else if(arguments.length){
    stackArguments = arguments;
    tick.stack = new Stack(stackArguments);
    return tick;
  } else {
    throw new Error('cannot construct a stack without arguments');
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
    completer: util.type(o.completer).function
      || function defautlCompleter(line, callback){
        return util.completer(self, line, callback);
      }
  }).on('line', function(line){
    if(!line.trim()){ return this.prompt(); }
    self.stack(line)();
  }).once('close', function(){
    self.repl = Runtime.prototype.repl; // undo override
  }).once('SIGINT', function(){
    if(!this._sawReturn){ this.output.write('\n'); }
    this.output.write(self.store.name + ' repl closed - ');
    this.output.write(new Date().toString() + '\n');
    process.exit(0);
  });

  this.repl.setPrompt(this.store.name + '> ');
  return this;
};
