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

  // readline interface
  if(opts.input){ host.readline(this, opts); }
}
util.inherits(Runtime, Manifold);

//
// ## Runtime.next
// > dispatch next command line (CL) to run
//
// Each CL creates a new context and a next callback
//
// returns this.next(ctx, args, next)
//
Runtime.prototype.context = function(/* arguments */){
  var line = arguments[0];
  var hrtime = { };

  function getTime(){
    /* jshint validthis: true */
    var time;
    if(hrtime[this.cmd.path]){
      time = process.hrtime(hrtime[this.cmd.path]);
      delete hrtime[this.cmd.path];
    } else {
      time = hrtime[this.cmd.path] = process.hrtime();
    }
    return util.prettyTime(time);
  }

  return {
    cmd: null,
    argv: this.boil('#context.argv')(line),
    time: getTime,
    done: 0,
    index: -1,
    async: false,
    clone: function(){ return util.merge({ }, this); },
    params: this.parse('#context.params')(line)
  };
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
  var self = this, scope = null;
  var args = util.args(arguments, {index : 1});

  function next(/* arguments */){
    /* jshint validthis: true */

    // return early
    if(next.done){ return next; }

    // refresh
    next.index += (next.cmd && next.cmd.depth) || 1;
    next.cmd = self.get(next.argv.slice(next.index));
    next.cmd.handle = next.cmd.handle || self.get().handle;
    if(!next.cmd.depth || !next.argv[next.index + 1]){ next.done++; }
    if(arguments.length){ args = util.args(arguments).concat(next); }

    try {
      if(this){ scope = this; }
      next.time(); next.cmd.handle.apply(scope || self, args);
    } catch(err){ self.next.apply(self, ['error'].concat(err, args)); }

    if(!next.async){ next(); }
    return next;
  }

  util.merge(next, this.context.apply(this, arguments));
  args.push(next);

  // dispatch first
  return next();
};
