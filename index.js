'use strict';

var util = require('./lib/util');

//
// ## module.exports
//
// - get: obtain a Runtime instance from cache
// - create: instantiate a Runtime instance and cache it
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
    if(err){ stack.console(err, next); }
    if(next.end) { return next.result; }
    if(next.wait && arguments.length > 1){
      stack.args = util.args(arguments);
    }

    next.end = true;
    stack.wait = next.wait;
    next.result = stack.result;
    var matchRE = new RegExp(next.match);
    stack.pending = stack.pending.replace(matchRE, '').trim();

    if(next.depth && stack.next){
      self.stack(stack);
    } else if(next.wait && stack.host && stack.host.next){
      stack.host.args = stack.args;
      self.stack(stack.host);
    }

    stack.console(null, next);
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
      if(arg instanceof Error){ stack.console(arg, next); }
      return self.stack(stack);
    }

    var stem = stack.match || stack.next;
    switch(typeof stack.next){
      case 'string':
        self.get(stem, next);
        next.match = next.match || next.path;
        stack.match = next.path.substring(next.match.length).trim();
        next.handle = next.handle || stack.handle;
      break;
      case 'function':
        if(typeof stem.path === 'string'){
          self.get(stem.path, next);
        }
        next.handle = stem;
        next.depth = next.depth || 1;
        next.match = (stem.stack instanceof Stack && stem.stack.path)
          || stem.name || stem.displayName;
      break;
      default:
        throw new TypeError('argument should be `string` or `function`');
    }

    next.wait = stack.wait;
    stack.console(null, next);
    if(!stack.match){ ++stack.index; }
    stack.next = stack.argv[stack.index];

    var result;
    util.asyncDone(function(){

      next.time = process.hrtime();
      stack.time = stack.time || process.hrtime();
      stack.args[0] = stem.stack instanceof Stack ? stack : next;

      result = next.handle.apply(stack, stack.args);

      stack.result = result || stack.result;

      if(stack.next && !next.wait){
        self.stack(stack);
      } else if(stack.host && stack.host.next && !stack.host.wait){
        stack.host.args = stack.args;
        self.stack(stack.host);
      }

      return result;
    }, function(err){ next(err); });
  }

  if(stack instanceof Stack){
    tick();
  } else {
    tick.stack = new Stack(stackArgs);
    return tick;
  }
};
