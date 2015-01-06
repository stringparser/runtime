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

  // default handler
  this.set(function rootNode(){
    throw new Error('no function to dispatch from\n' +
      'try this `runtime.set([Function])`\n');
  });

  // default reporter (for errors and logging)
  this.set('#report', function reportNode(err, next){
    if(err){ throw err; }
    var status = next.time ? 'done' : 'start';
    var time = next.time ? ('in ' + next.time) : '';
    console.log('[%s] >%s<', status, next.found, time);
    if(next.time){
      console.log(' >pending: [%s]', next.done());
    }
    if(!next.done().length){ console.log(next); }
  });

  // make repl
  if(opts.input || opts.output){ this.repl(opts); }
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

  var self = this, ctx = { };
  var args = util.args(arguments, 1).concat('next');
  ctx.handle = this.get(arguments[0], ctx).handle || this.get().handle;
  var reporter = this.get('#report ' + ctx.path).handle;
  var pending = ctx.path;

  util.merge(loop, {
    argv: pending.split(/[ ]+/),
    index: 0,
    wait: false,
    done: function done(name){
      if(!name){ return pending; }
      return !pending.match(name);
    }
  });

  ctx = self;
  function loop(){
    /* jshint validthis:true */
    function next(err){
      if(next.time && typeof next.time !== 'string'){
        next.time = util.prettyTime(process.hrtime(next.time));
        pending = pending.replace(next.found, '')
          .replace(/[ ]{2,}/g, ' ').trim();
      }

      ctx = this || ctx;
      if(err){
        err = util.type(err).error || null;
        args = util.args(arguments, err ? 1 : 0).concat(next);
      }
      reporter.call(ctx, err, next);

      loop.wait = next.wait; // so wait propagates
      next.time = next.time || process.hrtime();
      if(!next.depth || !loop.argv[loop.index]){ return next.result; }
      loop();
      return next.result;
    }
    util.merge(next, loop);

    next.handle = self.get(next.argv.slice(loop.index), next).handle;
    if(!next.handle){ next.handle = ctx.handle; }
    next.index = loop.index += (next.depth || 1);
    args[args.length-1] = next;

    try {
      next.time = process.hrtime();
      next.result = next.handle.apply(ctx, args);
      loop.index = next.index;
    } catch(error){ next(error); }

    if(next.wait){ return next.result; }
    next.time = null;
    return next();
  }

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
