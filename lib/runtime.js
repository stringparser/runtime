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

function Runtime(name, opt){

  if( !(this instanceof Runtime) ){
    return new Runtime(name, opt);
  }

  // currywurst
  opt = util.type(opt || name).plainObject || { };
  opt.name = opt.name || name;

  util.merge(this, Manifold.call(this, opt));

  // default rootHandle
  this.set(function rootNode(){
    throw new Error(
      'runtime.get() needs a function to dispatch\n' +
      'try this `runtime.set(function)`\n');
  });

  // default errorHandle
  this.set('error', function errorNode(err){ throw err; });

  if(opt.input){ this.repl(opt); }
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
  var self = this;
  arguments[arguments.length++] = next;
  var args = util.args(arguments, 1);
  var errorHandle = this.get('error').handle;

  var ctx = this.get(arguments[0]);

  function next(stem){
    /*jshint validthis:true */
    // return early
    if(util.type(stem).string){
      return self.next.apply(self, arguments)();
    } else if(!ctx.depth || !next.argv[next.index]){
      next.done = next.done || 0; next.done++;
      console.log('done', next.done);
      return next;
    }

    if(this && util.type(this).object){ util.merge(ctx, this); }
    // swap args
    if(arguments.length){
      arguments[arguments.length++] = next;
      args = util.args(arguments);
    }

    // refresh
    var handle = self.get(next.argv.slice(next.index), ctx).handle;
    if(!handle){ handle = self.get().handle; }
    next.index += (ctx.depth || 1); next.time(ctx.path);

    var ret;
    try { ret = handle.apply(util.merge({}, ctx), args); }
      catch(error){ errorHandle.apply(ctx, [error].concat(args)); }

    if(!next.wait){ return next(); }
    return next;
  }

  util.merge(next, {
     _id: Object.create(null),
    argv: this.boil('#context.argv')(arguments[0]),
    index: 0,
    time: function getTime(name){
      var time = this._id[name];
      if(typeof time === 'string'){ return time; }
      if(time === void 0){ this._id[name] = process.hrtime(); }
      else { this._id[name] = util.prettyTime(process.hrtime(time)); }
      return this._id[name] || this._id;
    }
  });

  // simple
  return next;
};
