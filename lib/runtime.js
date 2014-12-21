'use strict';

/*
 * Module dependencies
 */
var util = require('./utils');
var host = util.requirem('./host');
var Manifold = require('manifold');

// var debug = util.debug(__filename);

exports = module.exports = {
      get : get,
   create : create,
  Runtime : Runtime
};

/**
 * doc holder
 */
var warehouse = { };
function create(name, config){
  name = util.type(name).string || '#root';
  return (warehouse[name] = new Runtime(name, config));
}

/**
 * doc holder
 */

function get(name, opts){
  return warehouse[name] || create(name, opts);
}

/**
 * doc holder
 */

function Runtime(name, opts){

  if( !(this instanceof Runtime) ){
    return new Runtime(name || opts, opts);
  }

  // currywurst
  opts = util.type(opts || name).plainObject || { };
  opts.name = opts.name || name;

  util.merge(this, Manifold.call(this, opts));

  // default rootHandle
  this.set(function rootNode(){
    throw new Error('From rootNode.handle'+
      '\n runtime.get() needs a function to dispatch from' +
      '\n start with runtime.set(`function`)\n');
  });

  // default errorHandle
  this.set('error', function errorNode(err){ throw err; });
}
util.inherits(Runtime, Manifold);

Runtime.prototype.repl = function(opt){
  // readline interface
  if(!this.input){ host.readline(this, opt); }
  return this;
};

// ## Runtime.context
// > premise: context that can handle time and state
//
// arguments
//  - `stems`: type `string` or `array`
//  rest of arguments are stored at `.args`
//
// return
//  - `object` representing a context
//

Runtime.prototype.context = function(/* arguments */){
  var hrtime = { }, line = arguments[0];

  return ({
    cmd: null,
    done: 0,
    argv: this.boil('#context.argv')(line),
    args: util.args(arguments, {index : 1}),
    time: function getTime(){
      var time;
      if(hrtime[this.cmd.path]){
        time = process.hrtime(hrtime[this.cmd.path]);
        delete hrtime[this.cmd.path];
      } else { time = hrtime[this.cmd.path] = process.hrtime(); }
      return util.prettyTime(time);
    },
    index: -1,
    clone: function shallowClone(key){
      var shallow = util.merge({ }, this[key] || this);
      return shallow;
    }
  });
};

//
// ## Runtime.next
// > dispatch next command line (CL) to run
//
// Each CL creates a new context and a next callback
//
// returns this.next(ctx, args, next)
//

Runtime.prototype.next = function(/* arguments */){
  var self = this;
  var swamp = { };

  function next(stem /* arguments */){
    // return early
    if(util.type(stem).string){
      return self.next.apply(self, arguments)();
    } else if(next.done){ return next; }

    // refresh
    next.index += (next.cmd && next.cmd.depth) || 1;
    next.cmd = self.get(next.argv.slice(next.index));
    next.cmd.handle = next.cmd.handle || self.get().handle;
    if(!next.cmd.depth || !next.argv[next.index+1]){ next.done++; }
    if(arguments.length){
      next.args = util.args(arguments);
      next.args[next.args.length++] = next;
    }

    try { // run
      next.time();
      next.cmd.handle.apply(swamp, next.args);
    } catch(err){
      self.next.apply(self, ['error'].concat(err, next.args));
    }

    if(next.async){ return next; }
    return next();
  }
  util.merge(next, this.context.apply(this, arguments));
  next.args[next.args.length++] = next;

  // simple
  return next;
};
