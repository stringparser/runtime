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

    var path = next.match || next.path;

    if(next.start){
      console.log('Stack begin: >%s<', next.start);
    } else if(next.end){
      console.log('Stack ended with >%s< in %s\n', path, next.time);
      return ;
    }

    var status = next.time ? 'Finished' : 'Wait for';
    var time = next.time ? ('in ' + next.time) : '';
    console.log('- %s >%s< %s', status, path, time);
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

    if(arguments.length){
      err = err instanceof Error ? err : null;
      stack.args = util.args(arguments, err ? 1 : 0);
    }

    // propagate
    stack.wait = next.wait;
    stack.scope = this || stack.scope;
    next.time = next.time || process.hrtime();

    if(next.depth && next.argv[stack.length]){
      self.next(stack)();
    } else { next.end = true; }

    stack.report.call(stack.scope, err, next, stack.args);

    return stack.result;
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
  } else if (stem && stem.stack instanceof Stack){
    next.handle = stem;
    next.match = stem.stack.path;
    stem.stack.args = stack.args;
    next.depth = stem.stack.depth || 1;
  } else {
    self.get(stem.path || stem.name || stem.displayName, next);
    next.handle = stem; next.depth = next.depth || 1;
  }

  if(!stack.match){ stack.length++; }

  var chosen = stem.stack || stack;
  util.merge(next, {
    wait: chosen.wait,
    argv: chosen.argv,
    done: chosen.done,
    result: chosen.result || null
  });

  function tick(stem){
    stem = stem && stem.handle;
    if(stem && stem.stack instanceof Stack){
      next.start = chosen.path;
    } else if(arguments.length){
      next.start = chosen.path;
      stack.args = util.args(arguments);
    }

    stack.report.call(stack.scope, null, next, stack.args);
    next.start = null;

    util.asyncDone(function(){
      next.time = process.hrtime();
      stack.result = next.handle.call(stack.scope, next, stack.args);
      if(next.wait){ return stack.result; }

      var res = stack.result;
      res = !res || res.on || res.then || res.subscribe;
      if(typeof res === 'function'){ next.time = null; }
      return next();
    }, next);

    return next;
  }
  tick.next = next;
  tick.stack = stack;

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
    args: ['n'], length: 0,
    scope: app
  });

  var type, elem, index = -1;
  while(++index < args.length){
    elem = args[index] = Args[index];
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
