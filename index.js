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

  // ## runtime.note
  // > annotate stacks: logging, errors, etc.
  //
  // instanceof Manifold
  //

  var self = this;
  this.note = new Manifold({name: this.get().name + 'Notes'});
  this.note.set(function rootNotes(err, next){
    if(err){ throw err; } else if(!self.log){
      return next.result;
    }

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
  var stem = stack.match || stack.argv[stack.index];

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

  if(!stack.match){ stack.index++; }

  var self = this;
  function next(err){
    stack.note(err, next);
    if(next.end){ return next.result; }

    next.end = true;
    stack.wait = next.wait;
    next.time = process.hrtime(next.time);
    stack.pending = stack.pending.replace(next.match, '')
      .replace(/[ ]{2,}/g, ' ').trim();

    if(!stackPath){ stack.note(null, next); }

    if(arguments.length > 1){
      stack.args = util.args(arguments, 1);
    }

    // go next tick
    if(next.depth && stack.argv[stack.index]){
      self.next(stack, host)();
    } else if(next.wait && host && host.argv[host.index]){
      host.args = stack.args;
      self.next(host)();
    }

    return stack.result;
  }

  //
  // --
  //
  var err = null;
  tick.stack = stack;
  function tick(arg){
    // are we nested inside other stack?
    if(arg && arg.stack instanceof Stack){
      host = stack.host = arg.stack;
    } else if(arg instanceof Error){ err = arg; }

    if(arguments.length > 1){
      stack.args = util.args(arguments, 1);
    }

    next.stack = stack;

    if(!stackPath){
      stack.note(err, next);
    }

    next.wait = (host || stack).wait;

    util.asyncDone(function(){
      next.time = process.hrtime();
      var args = [next].concat(stack.args);
      stack.result = next.handle.apply(stack.scope || self, args);
      if(!next.wait && !next.end){ next(err); }
      return stack.result;
    }, function(error){ next(error); });

    return stack.result;
  }

  return tick;
};
