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
  this.set('#report :path', function reportNode(error, next){
    if(error){ throw error; }
    var status = next.time ? 'Finished' : 'Wait for';
    var time = next.time ? ('in ' + next.time) : '';
    var path = next.stack.path || next.match;
    if(next.time){ path = next.match; }
    console.log('[-] %s >%s< %s', status, path, time);
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

Runtime.prototype.next = function(stack){

  if(!(stack instanceof Stack)){
    stack = new Stack(this, arguments);
    stack.done = function done(name){
      if(name){ return stack.path.match(name); }
      return stack.path;
    };
  }

  var self = this;
  function next(err){
    /* jshint validthis:true */
    if(next.time && typeof next.time !== 'string'){
      next.time = util.prettyTime(process.hrtime(next.time));
      stack.path = stack.path.replace(next.match, '')
        .replace(/[ ]{2,}/g, ' ').trim();
    }

    next.error = err = err instanceof Error ? err : null;
    stack.report.call(stack.scope, err, next, stack.args);

    // propagate
    stack.wait = next.wait;
    stack.scope = this || stack.scope;
    next.time = next.time || process.hrtime();

    if(arguments.length){
      var index = err ? 0 : -1;
      arguments[index] = next;
      stack.args = util.args(arguments, index);
    }

    if(next.depth && next.argv[stack.length]){
      self.next(stack)();
    } else { console.log('next done'); }

    return next.result;
  }

  // ↑ above `next`
  // ----------------------------------
  // ↓ below `tick`

  var stem = stack.match || stack.argv[stack.length];
  var type = typeof stem;

  if(type.length < 8){ // 'string'.length < 'function'.length
    self.get(stem, next);
    if(!next.handle){ next.handle = stack.handle; }
    stack.match = next.argv.slice(next.depth || 1).join(' ') || null;
  } else if(stem && stem.stack instanceof Stack){
    util.merge(next, stack);
    next.handle = stem;
    next.stack = stem.stack;
    next.stack.args = stack.args;
  } else {
    self.get(stem.path || stem.name || stem.displayName, next);
    next.handle = stem; next.depth = next.depth || 1;
  }

  util.merge(next, {
    wait: stack.wait,
    argv: stack.argv,
    done: stack.done,
    index: stack.index,
    result: stack.result || null,
    stack: stack
  });

  tick.stack = stack;
  function tick(arg){
    var host;
    if(arguments.length){
      host = arg && arg.handle && (arg.handle.stack instanceof Stack);
      if(!host){ stack.args = util.args(arguments); }
    }

    util.asyncDone(function(){
      next.time = process.hrtime();
      stack.result = next.handle.call(stack.scope, next, stack.args);
      if(next.wait){ return next.result; }

      var res = stack.result;
      if(!res){ } else
      if(typeof (res.on || res.then || res.subscribe) !== 'function'){
        next.time = null;
      }

      next();

      return stack.result;
    }, next);

    if(!host && !stack.length){
      next.begin = true;
      stack.report.call(stack.scope, null, next, stack.args);
    }

    if(!stack.match){ stack.length++; }
    return next;
  }

  return tick;
};

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
    path: '', wait: false,
    args: [], index: 0, length: 0,
    scope: app
  });

  var type, elem;
  while(this.index < args.length){
    elem = Args[this.index];
    args[this.index] = Args[this.index++];
    if( !(/function|string/).test((type = typeof elem)) ){
      throw new TypeError('argument should be `string` or `function`');
    }
    if(type.length > 6){ // 'function'.length > 'string'.length
      elem = (elem.stack && elem.stack.path)
       || elem.path || elem.name || elem.displayName;
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
}

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
