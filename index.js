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
  get.cache[name] = get.cache[name] || new Runtime(name, opts);
  return get.cache[name];
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
  this.set('#report :path', function reportNode(err, next){
    if(err){ throw err; }
    var wait = next.done();
    var status = next.time ? 'done' : 'start';
    var time = next.time ? ('in ' + next.time) : '';
    console.log('[%s] >%s<', status, next.match, time);
    if(next.time){
      if(wait){ console.log('[wait] %s',  wait); }
      console.log();
    }
  });

  // make repl
  if(opts.input || opts.output){ this.repl(opts); }
}
util.inherits(Runtime, Manifold);

// ## Stack(app, args)
// > produce a consumable arguments array
//
// arguments
//
// return
//
// --
// api.private
// --

function Stack(app, Args){
  if(!(this instanceof Stack)){
    return new Stack(app, Args);
  }

  var args = new Array(Args.length);
  util.merge(this, {
    path: '', args: ['next'],
    index: 0, length: 0
  });

  var type, elem;
  while(this.index < args.length){
    elem = Args[this.index];
    args[this.index] = Args[this.index++];
    if( !(/function|string/).test((type = typeof elem)) ){
      throw new TypeError('argument should be `string` or `function`');
    }
    if(type.length > 6){ // 'function'.length > 'string'.length
      elem = elem.path || elem.name || elem.displayName;
    }
    this.path += elem + ' ';
  }

  app.get(this.path, this);
  this.handle = util.type(this.handle).function
    || app.get().handle;
  this.report = util.type(this.report).function
    || app.get('#report ' + (this.match || this.path)).handle;

  this.argv = args;
  this.match = null;
  this.index = this.length = 0;
  this.wait = false;
  this.scope = app;
}

// ## Runtime.next(/* arguments */)
// > dispatch next command
//
// arguments
//
// return
//

Runtime.prototype.tick = function(stack){

  if(!(stack instanceof Stack)){
    stack = new Stack(this, arguments);
    stack.done = function done(name){
      if(name){ return stack.path.match(name); }
      return stack.path;
    };
  }

  var self = this;
  var stem = stack.match || stack.argv[stack.length];
  var type = typeof stem;

  function next(err){
    /* jshint validthis:true */
    if(next.time && typeof next.time !== 'string'){
      next.time = util.prettyTime(process.hrtime(next.time));
      stack.path = stack.path.replace(next.match, '')
      .replace(/[ ]{2,}/g, ' ').trim();
    }

    if(arguments.length > 1){
      stack.args = util.args(arguments,
        err && err instanceof Error ? 1 : 0).concat(next);
    }

    stack.wait = next.wait; // so wait propagates
    stack.scope = this || stack.scope;
    stack.report.call(stack.scope, err, next);
    next.time = next.time || process.hrtime();

    if(next.depth && next.argv[stack.length]){
      self.tick(stack)();
    }
    return next.result;
  }

  if(type.length < 8){ // 'string'.length < 'function'.length
    self.get(stem, next);
    if(!next.handle){ next.handle = stack.handle; }
    stack.match = next.argv.slice(next.depth || 1).join(' ') || null;
  } else {
    self.get(stem.path || stem.name || stem.displayName, next);
    next.handle = stem; next.depth = next.depth || 1;
  }

  next.argv = stack.argv;
  next.done = stack.done;
  if(!stack.match){ stack.length++; }
  stack.args[stack.args.length-1] = next;
  stack.index++;

  return function tick(/* arguments */){

    if(arguments.length){
      arguments[arguments.length++] = next;
      stack.args = util.args(arguments);
    }

    util.asyncDone(function(){
      next.index = stack.length;
      next.time = process.hrtime();

      next.result = next.handle.apply(stack.scope, stack.args);

      if(stack.length - next.index){
        stack.match = next.match;
        stack.length = next.index;
      }

      if(next.wait){ return next.result; }

      next.time = null; next();
      if(!next.result){ next(); }
      return next.result;
    }, function(err){ next(err); });
  };
};

// ## Runtime.next(/* arguments */)
// > dispatch next command
//
// arguments
//
// return
//

Runtime.prototype.next = function(/* arguments */){

  var self = this, ctx = { };
  var args, pending;

  util.merge(tick, {
    argv: pending.split(/[ ]+/),
    index: 0,
    wait: false,
    done: function done(name){
      if(!name){ return !Boolean(pending); }
      return !pending.match(name);
    }
  });

  ctx = self;
  function tick(args_){
    /* jshint validthis:true */
    function next(err){
      if(next.time && typeof next.time !== 'string'){
        next.time = util.prettyTime(process.hrtime(next.time));
        pending = pending.replace(next.found, '')
          .replace(/[ ]{2,}/g, ' ').trim();
      }

      if(arguments.length > 1){
        args = util.args(arguments, 1).concat(next);
      }

      ctx = this || ctx;
      tick.wait = next.wait; // so wait propagates
      reporter.call(ctx, err, next);
      next.time = next.time || process.hrtime();
      if(!next.depth || !tick.argv[tick.index]){ return ; }
      tick();
      return next.result;
    }
    util.merge(next, tick);

    var cmd = next.argv.slice(tick.index);
    next.handle = self.get(cmd, next).handle;
    if(!next.handle){ next.handle = main.handle; }
    next.index = tick.index += (next.depth || 1);
    args[args.length-1] = next;

    util.asyncDone(function(){
      next.time = process.hrtime();
      next.result = next.handle.apply(ctx, args);
      tick.index = next.index;
      if(next.wait){ return next.result; }
      next.time = null; next();
      return next.result;
    }, function(err){
      if(err){ return next(err); }
      next();
    });
  }

  return tick;
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
