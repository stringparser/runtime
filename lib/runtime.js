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

  this.set(function rootNode(){
    throw new Error('From rootNode.handle'+
      '\n runtime.get() needs a function to dispatch from' +
      '\n start with runtime.set(`function`)\n');
  });

  // readline interface
  if(opts.input){ host.readline(this, opts); }
}
util.inherits(Runtime, Manifold);

Runtime.prototype.context = function(/* arguments */){
  var line = arguments[0];
  return {
     index : -1,
      argv : this.boil('#new.context')(line),
      args : util.args(arguments, {index : 1}),
    params : this.parse('#new.context')(line),
       cmd : this.get(line),
     async : true,
      done : false
  };
};

/**
 * ## Runtime.next
 * > dispatch next command line (CL) to run
 *
 * Each CL creates a new context and a next callback
 *
 * returns this.next(ctx, args, next)
 */
Runtime.prototype.next = function(/* arguments */){
  var self = this;
  var ctx = this.context.apply(this, arguments);

  function next(stem){
    // split into another context
    if(util.type(stem).string){
      return self.next.apply(self, arguments);
    } else if(ctx.done){ return ctx; }
    // same command with new arguments
    if(arguments.length){ ctx.args = util.args(arguments); }

    ctx.index += (ctx.cmd.depth || 1);
    ctx.cmd = self.get(ctx.argv.slice(ctx.index));
    ctx.cmd.handle = ctx.cmd.handle || self.get().handle;
    ctx.done = !ctx.cmd.depth || !Boolean(ctx.argv[ctx.index+1]);
    next.index = ctx.index;
    // next command with copied vars
    ctx.cmd.handle.apply(ctx, ctx.args);
    if(!ctx.async){ next(); }
    return ctx;
  }
  ctx.next = next;

  next(); // first dispatch
  return ctx;
};
