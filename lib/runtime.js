'use strict';

/*
 * Module dependencies
 */
var util = require('./util');
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

//
// ## Runtime.next
// > dispatch next command line (CL) to run
//
// Each CL creates a new context and a next callback
//
// returns this.next(ctx, args, next)
//

Runtime.prototype.next = function(/* arguments */){
  arguments[arguments.length++] = next;
  var self = this, ctx = { }, line = arguments[0];

  function next(stem){
    // return early
    if(util.type(stem).string){
      return self.next.apply(self, arguments);
    } else if(!next.depth || !next.argv[next.index]){ return next; }

    // swap args
    if(arguments.length){
      arguments[arguments.length++] = next;
      next.args = util.args(arguments);
    }

    // refresh
    next.index += (next.depth || 1);
    util.merge(next, self.get(next.argv.slice(next.index)));
    if(!next.handle){ next.handle = self.get(); }
    // run
    try { next.handle.apply(ctx, next.args); }
    catch(error){
      next.args[-1] = error;
      next.args = util.args(next.args, -1);
      self.get('error').handle.apply(ctx, next.args);
    }

    if(next.async){ return next; }
    return next();
  }

  var hrtime = { };
  util.merge(next, {
    argv: this.boil('#context.argv')(line),
    args: util.args(arguments, 1),
    depth: 1,
    index: 0,
    time: function getTime(){
      var time;
      if(hrtime[this.path]){
        time = process.hrtime(hrtime[this.path]);
        hrtime[this.path] = null;
      } else { time = hrtime[this.path] = process.hrtime(); }
      return util.prettyTime(time);
    },
    clone: function shallowClone(key){
      var shallow = util.merge({ }, this[key] || this);
      return shallow;
    }
  });

  // simple
  return next;
};
