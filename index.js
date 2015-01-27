'use strict';

var util = require('./lib/util');
var Stack = require('./lib/stack');
var Manifold = require('manifold');

//
// ## module.exports
//
// - get: obtain a Runtime instance from cache
// - create: instantiate a Runtime instance and cache it
//
// returns this.next(ctx, args, next)
//

exports = module.exports = {
  get: get,
  repl: require('./lib/repl'),
  create: create,
  Runtime: Runtime,
  Manifold: Manifold
};

function get(name){
  return get.cache[name];
}
get.cache = { };

function create(name, opts){
  name = util.type(name).string || '#root';
  get.cache[name] = get.cache[name] || new Runtime(name, opts);
  return get.cache[name];
}

// ## Runtime([name, opts])
// > constructor
//
// arguments
//  - name: type `string`, name for the runtime
//  - opts

// return
//

function Runtime(name, opt){

  if( !(this instanceof Runtime) ){
    return new Runtime(name, opt);
  }

  // Runtime `name`
  opt = util.type(opt || name).plainObject || { };
  opt.name = opt.name || name;

  Manifold.call(this, opt);

  // default notFound handle
  this.set(function notFound(next){
    throw new Error(' No handle found for \''+next.path+'\' path, you can:\n' +
      '\t- Define one with `runtime.set('+next.path+', [Function])`\n'+
      '\t- Provide a function instead of a string to runtime.next\n'+
      '\t- Override this handle with `runtime.set([Function])` and do'
      +' something about it\n');
  });

  // loggers and errorHandlers
  name = this.get().name;
  this.error = new Manifold({name: name + ' errors'});
  this.error.set(function rootError(err){
    if(err){ throw err; }
  });

  if(opt.log === false){ return this; }

  this.log = new Manifold({name: name + ' loggers'});
  this.log.set(function rootLogger(next){
    var path = next.match || next.path;
    var main = next.handle.stack || next.stack;
    var status = next.time ? 'Finished' : 'Wait for';
    var time = next.time ? ('in ' + util.prettyTime(next.time)) : '';

    if(main.start){
      console.log('Stack `%s` dispatch started', main.path);
    }

    console.log('- %s `%s` %s', status, path, time);
  });

}
util.inherits(Runtime, Manifold);

// ## Runtime.next(/* arguments */)
// > dispatch next commands
//
// arguments
//
// return
//

Runtime.prototype.next = function(stack){

  if(!(stack instanceof Stack)){
    stack = new Stack(this, arguments);
  }

  stack.start = !stack.index;

  // --
  var isStack;
  var stem = stack.match || stack.argv[stack.length];

  if(typeof stem === 'string'){
    this.get(stem, next);
    if(!next.handle){ next.handle = stack.handle; }
    stack.match = next.path.replace(next.match, '').trim();
  } else if (stem.stack instanceof Stack){
    isStack = true;
    next.handle = stem;
    next.path = stem.stack.path;
    next.depth = stem.stack.depth || 1;
    stem.stack.args = stack.args; // pass args between stacks
  } else {
    this.get(stem.path || stem.name || stem.displayName, next);
    next.handle = stem; next.depth = next.depth || 1;
  }

  // sync next with stack
  util.merge(next, {
    wait: stack.wait, // isolates nested stack's state
    stack: stack,
    result: (next.stack || stack).result || null,
  });

  stack.index++;
  if(!stack.match){ stack.length++; }

  var self = this;
  function next(err){
    stack.error(err, next);
    if(next.end){ return next.result; }
    if(typeof next.time !== 'string'){
      next.time = process.hrtime(next.time);
      stack.pending = stack.pending.replace(next.match, '')
        .replace(/[ ]{2,}/g, ' ').trim();
      next.end = true; stack.start = null;
      if(!isStack){ stack.log(next); }
    }

    // propagate and correct
    stack.wait = next.wait;
    next.result = stack.result;

    if(arguments.length > 1){
      stack.args = util.args(arguments, 1);
    }

    // go next tick
    if(next.depth && stack.argv[stack.length]){
      self.next(stack)();
    }

    return stack.result;
  }

  //
  // --
  //

  tick.stack = stack;
  function tick(arg){
    if(stack.start && arguments.length){
      stack.args = util.args(arguments,
        arg && arg.stack instanceof Stack ? 1 : 0);
    }

    if(!isStack){ stack.log(next); }

    util.asyncDone(function(){
      next.time = process.hrtime();
      var args = [next].concat(stack.args);
      var res = next.handle.apply(stack.scope || self, args);
      stack.result = res || stack.result;
      if(next.wait){ return res; }
      if(!next.end){ next(); }
      return res;
    }, function(err){ return next(err); });

    return next;
  }

  return tick;
};
