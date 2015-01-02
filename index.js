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

  // default the reporter
  //

  app('#report', function reportNode(err, next){
    if(next.found[1].source){ console.log(next); }
    if(err){ throw err; }
    console.log('[%s] >%s< in', next.time ? 'done' : 'start',
      next.found, next.time);
    if(next.done){ console.log(next); }
  });

  return app;
}
util.inherits(Runtime, Manifold);

// ## Runtime.next(/* arguments */)
// > dispatch next command
//
// arguments
//
// return
//

Runtime.prototype.next = function(/* arguments */){

  var self = this;
  var args = util.args(arguments);
  var ctx = this.get(args.shift());
  var reporter = this.get('#report ' + ctx.path).handle;
  ctx.handle = ctx.handle || this.get().handle;

  function loop(){
    /* jshint validthis:true */
    function next(err, reload){

      ctx = this || ctx;
      if(reload){ args = util.args(arguments, 1); }

      util.nextTick(function(){
        if(typeof next.time === 'string'){ }
        else if(next.wait || next.mark){
          next.time = next.mark || next.time;
          next.time = util.prettyTime(process.hrtime(next.time));
        } else { next.time = null; next.mark = process.hrtime(); }

        loop.wait = next.wait; // so wait propagates
        next.done = !next.depth || !next.argv[loop.index+1];
        reporter.call(ctx, err, next);
        if(next.done){ return next; }
        loop();
      });

      return next;
    }
    util.merge(next, loop);
    next.args = args.concat(next);

    next.handle = self.get(next.argv.slice(loop.index), next).handle;
    if(!next.handle){ next.handle = ctx.handle; }
    loop.index += (next.depth || 1);

    try {
      next.time = process.hrtime();
      next.handle.apply(ctx, next.args);
    } catch(error){ next(error); }

    if(next.wait){ return next; }
    return next();
  }

  util.merge(loop, {
    argv: this.boil('#next.argv')(arguments[0]),
    index: 0
  });

  return loop();
};

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
