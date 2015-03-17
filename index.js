'use strict';

var util = require('./lib/util');

//
// ## module.exports
//
// - create: obtain/create a Runtime instance from cache
// - Runtime: the runtime constructor
//

exports = module.exports = {
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

  opt = util.type(opt || name).plainObject || {};
  opt.name = opt.name || name;

  util.Manifold.call(this, opt);
  opt.log = opt.log === void 0 || opt.log;
  this.set(opt);

  function app(stem, opt){
    app.set(stem, opt);
    return app;
  }
  util.merge(app, this);
  return app;
}
util.inherits(Runtime, util.Manifold);

// ## Runtime.tick(/* arguments */)
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

Runtime.prototype.tick = function(stack){

  var stackArgs;
  var self = this;

  function next(err){
    if(err){ stack.onHandleError(err, next); }
    if(next.end) { return next.result; }
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
      self.tick(stack);
    } else if(stack.host && stack.host.next){
      stack.host.args = stack.args;
      self.tick(stack.host);
    }

    return next.result;
  }

  //
  // ---------
  //

  function tick(arg){
    if(tick.stack instanceof Stack){
      stack = new Stack(stackArgs, self);
      if(arg && arg.stack instanceof Stack){ stack.host = arg.stack; }
      stack.args = util.args(arguments, stack.host ? 0 : -1);
      if(arg instanceof Error){ stack.onError(arg, next); }
      stack.time = util.hrtime();
      return self.tick(stack);
    }

    stack.args[0] = next;
    next.wait = stack.wait || false;
    next.args = util.args(stack.args);
    var stem = stack.match || stack.next;

    switch(typeof stem){
      case 'string':
        self.get(stem, next);
        stack.match = next.path.substring(next.match.length).trim();
        next.handle = next.handle || stack.onHandleNotFound;
      break;
      case 'function':
        if(typeof stem.path === 'string'){
          self.get(stem.path, next);
        }
        next.handle = stem; next.depth = next.depth || 1;
        next.match = (stem.stack instanceof Stack && stem.stack.path)
         || next.match || stem.name || stem.displayName;
      break;
      default:
        throw new TypeError('arguments should be `string` or `function`');
    }

    if(!stack.match){
      stack.next = stack.argv[++stack.index];
    }

    stack.onHandle.apply(stack, next.args);
    stack.onHandleCall.apply(stack, next.args);

    util.asyncDone(function(){
      next.time = util.hrtime();
      next.result = next.handle.apply(stack.context, next.args);
      if(next.wait){ return next.result; }
      if(stack.next){
        self.tick(stack);
      } else if(stack.host && stack.host.next){
        self.tick(stack.host);
      }
      return next.result;
    }, function(err, result){
      next.result = result;
      next(err);
    });
  }


  next.stack = stack;
  if(stack instanceof Stack){ tick(); } else {
    stackArgs = arguments;
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
// PD: :) this was the very beginning of it all.
//
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
  this.repl.prompt();
  return this.repl;
};
