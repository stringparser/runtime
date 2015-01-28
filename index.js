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
    var main = next.stack;
    var host = next.stack.host;
    var path = next.match || next.path;
    var status = next.time ? 'Finished' : 'Wait for';
    var time = next.time ? ('in ' + util.prettyTime(next.time)) : '';

    if(main.start){
      if(host){
        console.log('Host `%s` started with `%s`', host.path, main.path);
      } else {
        console.log('Stack `%s` dispatch started', main.path);
      }
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

Runtime.prototype.next = function(stack, host){

  if(!(stack instanceof Stack)){
    stack = new Stack(this, arguments);
    stack.start = true;
    host = host && host instanceof Stack;
  }

  // --
  var stem = stack.match || stack.argv[stack.length];

  if(typeof stem === 'string'){
    this.get(stem, next);
    if(!next.handle){ next.handle = stack.handle; }
    stack.match = next.path.replace(next.match, '').trim();
  } else { // function
    var stackPath = stem.stack && stem.stack.path;
    this.get( stackPath || stem.name || stem.displayName, next);
    next.handle = stem; next.depth = next.depth || 1;
  }

  next.stack = stack;

  if(!stack.match){ stack.length++; }

  var self = this;
  function next(err){
    stack.error(err, next);
    if(next.end){ return next.result; }

    next.end = true;
    stack.wait = next.wait;
    next.time = process.hrtime(next.time);
    if(!stackPath){ stack.log(next); }

    if(arguments.length > 1){
      stack.args = util.args(arguments, 1);
    }

    // go next tick
    if(next.depth && stack.argv[stack.length]){
      self.next(stack, host)();
    } else if(next.wait && host && host.argv[host.length]){
      host.args = stack.args;
      self.next(host)();
    }

    return stack.result;
  }

  //
  // --
  //

  tick.stack = stack;
  function tick(arg){

    if(arguments.length){
      // check if we are nested inside other stack
      host = arg && arg.stack instanceof Stack && arg.stack;
      stack.args = util.args(arguments, host ? 1 : 0);
      stack.host = host;
    }

    next.stack = stack;

    if(!stackPath){
      stack.log(next);
      stack.start = false;
      if(host){ host.start = false; }
    }

    next.wait = (host || stack).wait;

    util.asyncDone(function(){
      next.time = process.hrtime();
      var args = [next].concat(stack.args);
      stack.result = next.handle.apply(stack.scope || self, args);
      if(!next.wait && !next.end){ next(); }
      return stack.result;
    }, function(err){ if(err){ next(err); } });

    return stack.result;
  }

  return tick;
};
