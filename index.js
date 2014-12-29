'use strict';

var util = require('./lib/util');
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

  var self = this;
  // modify the default keypress for SIGINT
  this.input.removeAllListeners('keypress');
  this.input.on('keypress', function (s, key){
    if( key && key.ctrl && key.name === 'c'){
      process.stdout.write('\n');
      process.exit(0);
    } else { self._ttyWrite(s, key); }
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
  var self = this, first =  { };
  var args = util.args(arguments, 1);
  var ctx = this.get(arguments[0], first);
  var errorHandle = this.get('error '+ctx.path).handle;

  function loop(){
    /* jshint validthis:true */
    function next(stem){
      var that = this || ctx;
      if(stem instanceof Error){
        return errorHandle.apply(that, arguments);
      } else if(arguments.length){ args = util.args(arguments); }

      util.nextTick(function(){
        loop.wait = next.wait;
        loop.done = Boolean(!ctx.depth || !loop.argv[loop.index]);
        var time = next.time();
        console.log('[time] >%s< in', next.found, time);
        loop.apply(that, arguments);
      });

      return next;
    }
    util.merge(next, loop);

    if(loop.done){ next.time(); console.log(loop); return next; }

    ctx.handle = self.get(next.argv.slice(loop.index), next).handle;
    ctx.handle = ctx.handle || self.get().handle;
    next.index = loop.index += (next.depth || 1);

    try {
      next.result = ctx.handle.apply(this, args.concat(next));
    } catch(error){ errorHandle.apply(ctx, [error].concat(args, next)); }

    if(next.wait === true){ next.time(); return next; }
    if(ctx.handle.length > args.length + 1){ return next(); }

    return next();
  }

  var hrtime = Object.create(null);
  util.merge(loop, {
    index: 0,
    hrtime: hrtime,
    argv: this.boil('#context.argv')(arguments[0]),
    time: function getTime(){
      if(this.done && !hrtime[this.path]){ return ; }
      var time = (hrtime[this.path] || Object.create(null));
      if(typeof time.done === 'string'){ return time.done; }
      if(time.start === void 0){
        return (hrtime[this.path] = {start: process.hrtime()});
      }
      time = hrtime[this.path].end = process.hrtime(time.start);
      time = hrtime[this.path].done = util.prettyTime(time);
      return time;
    }
  });

  return loop.apply(ctx, args);
};
