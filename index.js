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

    if(host && !main.time){
      console.log('Host `%s` is dispatching stack `%s`', host.path, main.path);
    } else if(!main.time){
      console.log('Stack `%s` started', main.path);
    } else {
      console.log('- %s `%s` %s', status, path, time);
    }

    if(main.end){
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

Runtime.prototype.next = function(stack){

  var self = this, stackArgs;
  if(stack instanceof Stack){
    next.stack = stack;
    return tick();
  } else {
    stackArgs = arguments;
    stack = new Stack(this, arguments);
    next.stack = tick.stack = stack;
    return tick;
  }

  // runtime `next`
  //  > dispatch next handle
  //

  function next(err){
    if(next.end){ return stack.result; }
    if(arguments.length > 1){
      stack.args = util.args(arguments);
    }

    next.end = true;
    stack.wait = next.wait;
    next.time = process.hrtime(next.time);

    // go tick
    if(next.depth && stack.argv[stack.index]){
      self.next(stack);
    } else if(next.wait && stack.host && stack.host.argv[stack.host.index]){
      stack.time = process.hrtime(stack.time);
      stack.host.args = stack.args;
      self.next(stack.host);
    } else {
      stack.end = true;
      stack.time = process.hrtime(stack.time);
    }

    stack.note(err, next);
    return stack.result;
  }

  // runtime `tick`
  // > fetch and run a handle
  //

  function tick(arg){
    if(!stack.argv[stack.index]){
      stack = new Stack(self, stackArgs);
      tick.stack = next.stack = stack;
      next.time = next.wait = next.end = null;
    }

    var err = null;
    if(arguments.length){
       err = arg instanceof Error && arg;
      stack.host = arg && arg.stack instanceof Stack && arg.stack;
      stack.args = util.args(arguments, (err || stack.host) ? 0 : -1);
    }

    var stem = stack.match || stack.argv[stack.index];

    if(typeof stem === 'string'){
      self.get(stem, next);
      stack.match = next.path.replace(next.match, '').trim();

      if(typeof next.handle !== 'function'){ next.handle = stack.handle; }
    } else if(typeof stem === 'function'){
      var guestPath = stem.stack && stem.stack.path;
      self.get(guestPath || stem.name || stem.displayName, next);
      next.handle = stem; next.depth = next.depth || 1;
    } else {
      throw new TypeError('elements should be `string` or `function`');
    }

    if(!stack.match){ stack.index++; }
    next.wait = (stack.host || stack).wait;

    stack.note(err, next);
    stack.time = stack.time || process.hrtime();

    var result;
    util.asyncDone(function(){
      stack.args[0] = next;
      next.time = process.hrtime();
      result = next.handle.apply(stack.context, stack.args);
      stack.result = result || stack.result;
      if(!next.wait && !result && stack.argv[stack.index]){
        self.next(stack);
      }
      return result;
    }, function(err){ stack.note(err, next); });

    return stack.result;
  }
};
