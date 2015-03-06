'use strict';

var util = require('./lib/util');

//
// ## module.exports
//
// - repl: make a repl out of the Runtime Interface
// - create: obtain/create a Runtime instance from cache
// - Runtime: the runtime constructor
//

exports = module.exports = {
  repl: util.repl,
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
  util.Manifold.call(this, opt);
  this.set({log: opt.log === void 0});
}
util.inherits(Runtime, util.Manifold);

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

var Stack = util.Stack;

Runtime.prototype.stack = function(stack){

  var self = this;
  var stackArgs = arguments;

  function next(err){
    if(err){ stack.onError(err, next); }
    if(next.end) { return next.result; }
    if(arguments.length > 1){
      stack.args = util.args(arguments);
    }

    next.end = true;
    stack.wait = next.wait;
    if(stack.onEnd){ stack.onEnd(next); }

    if(next.depth && stack.next){
      self.stack(stack);
    } else if(next.wait && stack.host && stack.host.next){
      stack.host.args = stack.args;
      self.stack(stack.host);
    }

    return next.result;
  }

  //
  // ---------
  //

  function tick(arg){
    if(tick.stack instanceof Stack){
      stack = new Stack(stackArgs, self);
      stack.host = arg instanceof Stack && arg;
      stack.args = util.args(arguments, stack.host ? 0 : -1);
      if(arg instanceof Error){ stack.onError(arg, next); }
      if(stack.onCall){ stack.onCall(next); }
      stack.time = process.hrtime();
      return self.stack(stack);
    }

    next.wait = stack.wait || false;
    next.args = util.args(stack.args);
    var stem = stack.match || stack.next;
    next.args[0] = next;

    switch(typeof stem){
      case 'string':
        self.get(stem, next);
        stack.match = next.path.substring(next.match.length).trim();
        next.handle = next.handle || stack.onNotFound;
      break;
      case 'function':
        if(stem.stack instanceof Stack){
          next.args[0] = stack;
          next.match = stem.stack.path;
        } else if(typeof stem.path === 'string'){
          self.get(stem.path, next);
        }
        next.handle = stem; next.depth = next.depth || 1;
        next.match = next.match || stem.name || stem.displayName;
      break;
      default:
        throw new TypeError('argument should be `string` or `function`');
    }

    if(stack.next && !stack.match){
      stack.next = stack.argv[++stack.index];
    }

    if(stack.onCall){ stack.onCall(next); }

    util.asyncDone(function(){
      next.time = process.hrtime();
      var result = next.handle.apply(stack, next.args);
      next.result = result || next.result;
      if(next.wait){ return result; }
      if(stack.next || (stack.host && stack.host.next)){
        self.stack(stack.host || stack);
      }
      return result;
    }, function(err, result){
      next.result = result;
      next(err);
    });
  }

  if(stack instanceof Stack){ tick(); } else {
    tick.stack = new Stack(stackArgs);
    return tick;
  }
};
