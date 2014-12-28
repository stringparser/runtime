'use strict';

var util = require('./util');
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
  create: create,
  Runtime: Runtime
};

function get(name){
  return get.cache[name];
}
get.cache = { };

function create(name, opts){
  name = util.type(name).string || '#root';
  return (get.cache[name] = new Runtime(name, opts));
}

// ## Runtime([name, opts])
// > constructor
//
// arguments
//  - name: type `string`, name for the runtime
//  - opts

// return
//

function Runtime(name, opts){

  if( !(this instanceof Runtime) ){
    return new Runtime(name, opts);
  }

  // currywurst
  //
  opts = util.type(opts || name).plainObject || { };
  opts.name = opts.name || name;

  Manifold.call(this, opts);

  function app(stems, opt){
    if(opt || typeof stems !== 'string'){
      return app.set(stems, opt);
    }
    return app.get(stems, opt);
  }
  util.merge(app, this);

  var doREPL = util.type(opts.input || opts.output).match(/stream/);
  if(doREPL){ app.repl(opts); }

  // default handlers
  //
  app(function rootNode(){
    throw new Error(
      'runtime.get() needs a function to dispatch\n' +
      'try this `runtime.set(function)`\n');
  });

  // default errorHandle
  //
  app('error', function errorNode(err){ throw err; });

  return app;
}
util.inherits(Runtime, Manifold);

// ## Runtime.repl([opt])
// > REPL powered by the readline module
//
// arguments
//
// return
//

Runtime.prototype.repl = function(o){

  if(this.input){ return this; }

  // this was the very beginning of it all :D
  var readline = require('readline');

  util.merge(this, readline.createInterface({
    input: util.type(o.input).match(/stream/) || util.through.obj(),
    output: util.type(o.output).match(/stream/) || util.through.obj(),
    terminal: o.terminal,
    completer: util.type(o.completer).function || util.completer,
  }));

  this.on('line', this.next);
  if(!this.terminal){ return this; }

  // the default prompt
  this.setPrompt(' '+this.store.name+' > ');

  // modify the default keypress for SIGINT
  this.input.removeAllListeners('keypress');
  this.input.on('keypress', function (s, key){
    if( key && key.ctrl && key.name === 'c'){
      process.stdout.write('\n');
      process.exit(0);
    } else { this._ttyWrite(s, key); }
  });

  // make some methods chain
  var prompt = this.prompt;
  this.prompt = function(/* arguments */){
    prompt.apply(this, arguments);
    return this;
  };

  var setPrompt = this.setPrompt;
  this.setPrompt = function(/* arguments */){
    setPrompt.apply(this, arguments);
    return this;
  };

  return this;
};

// ## Runtime.next(/* arguments */)
// > dispatch next command
//
// arguments
//
// return
//

Runtime.prototype.next = function(/* arguments */){
  var self = this;

  arguments[arguments.length++] = follow;
  var args = util.args(arguments, 1);
  var errorHandle = this.get('error').handle;

  var ctx = this.get(arguments[0]);
  ctx.handle = ctx.handle || self.get().handle;

  function follow(ctx){
    var path = ctx.path;
    return function(){
      follow.time(path);
      return next.apply(self, arguments);
    };
  }

  function next(stem){
    /* jshint validthis:true */
    if(!ctx.depth || !next.argv[next.index]){ return follow; }
    var type = util.type(stem);
    if(type.string){ return self.next.apply(self, arguments); }
    if(type.error){ errorHandle.apply(self, arguments); }

    // swap args
    if(arguments.length){
      arguments[arguments.length++] = follow;
      args = util.args(arguments);
    }

    // refresh
    var cmd = self.get(next.argv.slice(next.index), ctx);
    if(!cmd.handle){ cmd.handle = self.get().handle; }
    next.index += (ctx.depth || 1); next.time(ctx.path);

    try {
      ctx.handle.apply(ctx, args.concat(follow));
    } catch(error){ errorHandle.apply(ctx, [error].concat(args)); }
    return follow;
  }

  util.merge(follow, {
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
  return next();
};
