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
//
//

exports = module.exports = {
  get: get,
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
//  runtime constructor
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

  // default rootNode, notFound handle
  this.set(function notFound(next){
    throw new Error(
      'No handle found for `'+next.path+'` path'+
      ', set one with runtime.set([function])'
    );
  });

  // ## runtime.note
  // > annotate stacks: logging, errors, etc.
  //
  // instanceof Manifold
  //

  this.note = new Manifold({name: this.get().name + 'Notes'});
  this.note.set(function rootNotes(err, next){
    if(err){ throw err; }

    var main = next.stack;
    var host = next.stack.host;
    var path = next.match || next.path;
    var status = next.time ? 'Finished' : 'Wait for';
    var time = next.time ? ('in ' + util.prettyTime(next.time)) : '';

    if(host && !main.time){
      console.log('Host `%s` is dispatching stack `%s`', host.path, main.path);
    } else if(!main.time){
      console.log('Stack `%s` started', main.path);
    } else {
      console.log('- %s `%s` %s', status, path, time);
    }

    if(!main.pending){
      path = main.path;
      time = util.prettyTime(main.time);
      console.log('Stack `%s` ended in', path, time);
    }
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

Runtime.prototype.stack = function(stack, hrtime, error){

  var self = this;

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
      self.stack(stack, hrtime);
    } else if(next.wait && stack.host instanceof Stack){
      stack.host.args = stack.args;
      self.stack(stack.host, process.hrtime());
    }

    stack.note(err, next);
    return stack.result;
  }

  //
  // ---------
  //

  function tick(arg){
    if(tick.stack instanceof Stack){
      stack = new Stack(tick.stack.args, self);
      error = (arg instanceof Error && arg) || null;
      stack.host = arg && arg.stack instanceof Stack && arg.stack;
      stack.args = util.args(arguments, (error || stack.host) ? 0 : -1);
      return self.stack(stack, process.hrtime(), error);
    }

    var path, stem = stack.match || stack.next;

    switch(typeof stem){
      case 'string':
        self.get(stem, next);
        path = next.match || next.path;
        stack.match = next.path.replace(path, '').trim();
        next.handle = next.handle || stack.handle;
      break;
      case 'function':
        path = (stem.stack && stem.stack.path) || stem.path;
        if(typeof path === 'string'){ self.get(path, next); }
        next.handle = stem; next.depth = next.depth || 1;
        next.match = next.path || stem.name || stem.displayName;
      break;
      default:
        console.log(stack);
        throw new TypeError('`string` or `function`');
    }

    if(!stack.match){ stack.index++; }
    next.wait = (stack.host || stack).wait;
    stack.next = stack.argv[stack.index];

    stack.note(error, next);

    var result;
    util.asyncDone(function(){
      stack.args[0] = next;
      next.time = process.hrtime();
      stack.time = process.hrtime(hrtime);
      result = next.handle.apply(stack, stack.args);
      stack.result = result || stack.result;
      if(stack.next && !next.wait){
        self.stack(stack, hrtime);
      }
      return result;
    }, function(err){ stack.note(err, next); });

    return stack.result;
  }

  if(stack instanceof Stack){
    next.stack = stack;
    return tick();
  } else {
    tick.stack = new Stack(arguments);
    return tick;
  }
};
