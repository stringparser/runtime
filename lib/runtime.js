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
  arguments[arguments.length++] = next;
  var self = this, ctx = { }, line = arguments[0];

  function next(stem){
    // return early
    if(util.type(stem).string){
      return self.next.apply(self, arguments)();
    } else if(!next.depth || !next.argv[next.index]){
      next.done = next.done || 0; next.done++;
      console.log('done', next.done);
      return next;
    }

    // swap args
    if(arguments.length){
      arguments[arguments.length++] = next;
      next.args = util.args(arguments);
    }

    // refresh
    next.index += (next.depth || 1);
    next._id = Math.random().toString(36);
    util.merge(next, self.get(next.argv.slice(next.index)));
    if(!next.handle){ next.handle = self.get(); }
    try {
      next.time(); next.handle.apply(ctx, next.args);
    } catch(error){
      next.args[-1] = error;
      next.args = util.args(next.args, -1);
      self.get('error').handle.apply(ctx, next.args);
    }

    if(next.series){
      console.log('<%s> was series', next.argv[next.index-1]);
      return next;
    }
    console.log('<%s> was parallel', next.argv[next.index-1]);
    return next();
  }

  var hrtime = { };
  util.merge(next, {
    argv: this.boil('#context.argv')(line),
    args: util.args(arguments, 1),
    depth: 1,
    index: 0,
    time: function getTime(){
      var id = this._id, time = hrtime[id];
      if(typeof time === 'string'){ return time; }
      if(time === void 0){ hrtime[id] = process.hrtime(); }
      else { hrtime[id] = util.prettyTime(process.hrtime(time)); }
      return hrtime[id];
    },
    clone: function shallowClone(key){
      return util.merge({}, this[key] || this);
    }
  });
  // simple
  return next;
};
