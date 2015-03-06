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
      var result = next.handle.apply(stack.context || stack, next.args);
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

// ## Runtime.repl(options)
// > create a repl for the given runtime
//
// arguments: options with non mandatory props below
//  - input, repl's stream output, defaults to process.stdin
//  - output, repl's stream output, defaults to process.stdout
//
// After its called, it will override the prototype
// and becomes a property with a readline instance
// --
// PD: This was the very beginning of it all :D
//
Runtime.prototype.repl = function(o){
  var self = this; o = o || { };
  this.repl = require('readline').createInterface({
    input: util.type(o.input).match(/stream/) || process.stdin,
    output: util.type(o.output).match(/stream/) || process.stdout,
    completer: util.type(o.completer).function  ||
      function(line, callback){
        return util.completer(self, line, callback);
      }
  });

  this.repl.on('line', function(line){
    if(!line.trim()){ return this.prompt(); }
    self.stack(line)();
  });

  if(!this.repl.terminal){ return this; }
  this.repl.setPrompt(this.store.name + '> ');

  // keypress for SIGINT
  this.repl.input.removeAllListeners('keypress');
  this.repl.input.on('keypress', function (str, key){
    if( key && key.ctrl && key.name === 'c'){
      process.stdout.write('\n');
      process.exit(0);
    } else { self.repl._ttyWrite(str, key); }
  });

  this.repl.prompt();
  return this;
};
