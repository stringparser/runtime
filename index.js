'use strict';

var util = require('./lib/util');
var repl = require('./lib/repl');
var Stack = require('./lib/stack');
var Manifold = require('manifold');

//
// ## module.exports
//
// - get: obtain a Runtime instance from cache
// - create: instantiate a Runtime instance and cache it
// - Runtime: the runtime constructor
//

exports = module.exports = {
  repl: repl,
  create: create,
  Runtime: Runtime
};

function create(name, opt){
  name = util.type(name).string || '#root';
  create.cache[name] = create.cache[name] || new Runtime(name, opt);
  return create.cache[name];
}
create.cache = { };

// ## Runtime([name, opts])
//  runtime constructor
//
// arguments
//  - name: type `string`, name for the runtime
//  - opt: options passed to the Manifold constructor

// returns the runtime instance
//

function Runtime(name, opt){

  if( !(this instanceof Runtime) ){
    return new Runtime(name, opt);
  }

  opt = opt || name || { };
  Manifold.call(this, opt);
  this.set({log: opt.log === void 0});
}
util.inherits(Runtime, Manifold);

// ## Runtime.stack(/* arguments */)
// > dispatch next element of a stack
//
// arguments can be `strings` and/or `functions`
//  - string: will correspond to handlers set with runtime.set
//  - function: will be run as written
//
// returns a `tick` function, this function can be called
// in order to execute the next element of the given stack.
//

Runtime.prototype.stack = function(stack, opt){

  var self = this;
  var stackArgs = arguments;

  function next(err){
    if(next.end){ return next.result; }
    if(arguments.length > 1){
      stack.args = util.args(arguments);
    }

    next.end = true;
    stack.wait = next.wait;
    next.time = process.hrtime(next.time);
    stack.pending = stack.pending.replace(next.match, '').trim();

    // ->tick<-
    if(next.depth && stack.next){
      self.stack(stack, opt);
    } else if(next.wait && stack.host instanceof Stack){
      stack.host.args = stack.args;
      self.stack(stack.host, {hrtime: process.hrtime()});
    }

    stack.note(err, next);
    return stack.result;
  }

  //
  // ---------
  //

  function tick(arg){
    if(tick.stack instanceof Stack){
      stack = new Stack(stackArgs, self);
      var error = arg instanceof Error && arg;
      stack.host = arg && arg.stack instanceof Stack && arg.stack;
      stack.args = util.args(arguments, stack.host ? 0 : -1);
      return self.stack(stack, {
        error: error,
        hrtime: process.hrtime()
      });
    }

    var stem = stack.match || stack.next;

    switch(typeof stem){
      case 'string':
        self.get(stem, next);
        stack.match = next.match || next.path;
        stack.match = next.path.replace(stack.match, '').trim();
        next.handle = next.handle || stack.handle;
      break;
      case 'function':
        if(typeof stem.path === 'string'){
          self.get(stem.path, next);
        }
        next.handle = stem; next.depth = next.depth || 1;
        next.match = (stem.stack instanceof Stack && stem.stack.path)
         || next.path || stem.name || stem.displayName;
      break;
      default:
        throw new TypeError('argument should be `string` or `function`');
    }

    if(!stack.match){ stack.index++; }

    next.wait = (stack.host || stack).wait;
    stack.next = stack.argv[stack.index];
    stack.note(opt.error, next);

    var result;
    util.asyncDone(function(){
      stack.args[0] = next;
      next.time = process.hrtime();
      stack.time = process.hrtime(opt.hrtime);
      result = next.handle.apply(stack, stack.args.concat());
      stack.result = result || stack.result;
      if(stack.next && !next.wait){
        self.stack(stack, opt);
      }
      return result;
    }, function(err){ stack.note(err, next); });
  }

  if(stack instanceof Stack){
    next.stack = stack;
    return tick();
  } else {
    tick.stack = new Stack(stackArgs);
    return tick;
  }
};
