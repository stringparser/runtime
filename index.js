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

  // default rootNode, notFound handle
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

  this.note = new Manifold({name: this.get().name + 'Notes'});
  this.note.set(function rootNotes(err, next){
    if(err){ throw err; }

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

Runtime.prototype.next = function(stack){

  var self = this;
  if(stack instanceof Stack){
    tick.stack = stack;
    return tick();
  } else {
    stack = new Stack(this, arguments);
    tick.stack = stack;
    return tick;
  }

  // runtime `next`
  //  > dispatch next handle
  //

  function next(err){
    if(next.end && next.end++){
      stack.note(err, next);
      return next.result;
    }

    next.end = 1;
    stack.wait = next.wait;
    next.result = stack.result;
    next.time = process.hrtime(next.time);

    if(arguments.length > 1){
      stack.args = util.args(arguments, 1);
    }

    // go next tick
    if(next.depth && stack.argv[stack.index]){
      self.next(stack);
    } else if(next.wait && stack.host && stack.host.argv[stack.host.index]){
      stack.time = process.hrtime(stack.time);
      stack.host.args = stack.args;
      self.next(stack.host);
    } else {
      stack.time = process.hrtime(stack.time);
      stack.end = true;
    }

    stack.note(err, next);

    return stack.result;
  }

  // runtime `tick`
  // > fetch and run a handle
  //

  function tick(host){
    var err = null;
    if(arguments.length){
      err = host instanceof Error ? host : null;
      stack.host = !err && host && host.stack instanceof Stack && host.stack;
      stack.args = util.args(arguments, (err || stack.host) ? 1 : 0);
    }

    var stem = stack.match || stack.argv[stack.index];

    if(typeof stem === 'string'){
      self.get(stem, next);
      if(!next.handle){ next.handle = stack.handle; }
      stack.match = next.path.replace(next.match, '').trim();
    } else if(typeof stem === 'function'){
      var guestPath = stem.stack instanceof Stack && stem.stack.path;
      self.get(guestPath || stem.name || stem.displayName, next);
      next.handle = stem; next.depth = next.depth || 1;
    } else {
      throw new TypeError('stack elements should be `string` or `function`');
    }

    if(!stack.match){ stack.index++; }

    next.stack = stack;
    next.wait = (stack.host || stack).wait;

    stack.note(err, next);
    stack.time = stack.time || process.hrtime();

    util.asyncDone(function(){
      next.time = process.hrtime();
      var args = [next].concat(stack.args);
      stack.result = next.handle.apply(stack.context || self, args);
      if(!next.wait && !next.end){ next(); }
      return stack.result;
    }, function(err){ stack.note(err, next); });

    return stack.result;
  }
};
