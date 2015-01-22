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
  Runtime: Runtime,
  Manifold: Manifold
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

  // currywurst!
  opts = util.type(opts || name).plainObject || { };
  opts.name = opts.name || name;

  Manifold.call(this, opts);

  // loggers and errorHandlers
  name = this.get().name;
  this.log = new Manifold(name + ' logger');
  this.error = new Manifold(name + ' error');

  // default rootNodeHandle
  this.set(function rootNode(){
    throw new Error('no function to dispatch from\n' +
      'try this `runtime.set([Function])`\n');
  });

  // default rootLoggerHandle
  this.log.set(function rootLogger(next){
    var main = next.stack;
    var path = next.match || next.path;
    var status = next.time ? 'Finished' : 'Wait for';
    var time = next.time ? ('in ' + next.time) : '';

    if(main.start){
      console.log('\nStack >%s< dispatch start', main.path);
    }

    if(main.end){
      console.log('Stack >%s< dispatch end\n', main.path);
    }

    console.log('- %s >%s< %s', status, path, time);
  });

  // default rootErrorHandle
  this.error.set(function rootErrorHandle(error){
    if(error){ throw error; }
  });

  // make repl
  if(opts.input || opts.output){ this.repl(opts); }
}
util.inherits(Runtime, Manifold);

// ## Stack(app, args)
// > produce a consumable stack object
//
// arguments
//
// return
//
// --
// api.private
// --

function Stack(app, args){

  if(!(this instanceof Stack)){
    return new Stack(app, args);
  }

  // stack path
  this.path = '';

  var index = -1;
  var elem, type, len = args.length;
  var argv = new Array(args.length);

  // extract string path
  while(++index < len){
    elem = argv[index] = args[index];
    type = typeof elem;
    // unsupported types
    if( !(/function|string/).test(type) ){
      throw new TypeError('argument should be `string` or `function`');
    }
    // 'function'.length > 'string'.length
    if(type.length > 6){
      elem = (elem.stack instanceof Stack && elem.stack.path)
      || elem.path || elem.name || elem.displayName;
    }
    this.path += elem + ' ';
  }

  // populate main stack props
  app.get(this.path, this);

  // rootHandler: handle if not present
  if(typeof this.handle !== 'function'){
    this.handle = app.get().handle;
  }

  // logNode: logging stack-wise
  if(typeof this.log !== 'function'){
    this.log = app.log.get(this.path).handle;
  }

  // errorNode: error handling stack-wise
  if(typeof this.error !== 'function'){
    this.error = app.error.get(this.path).handle;
  }

  // defaults
  this.pending = this.path;
  this.argv = argv;
  this.args = [ ];
  this.wait = false;
  this.match = null;
  this.index = this.length = 0;
  this.scope = app;
}

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
  }

  stack.start = !stack.index;

  // --
  var stem = stack.match || stack.argv[stack.length];

  if(typeof stem === 'string'){
    this.get(stem, next);
    if(!next.handle){ next.handle = stack.handle; }
    stack.match = next.argv.slice(next.depth || 1).join(' ') || null;
  } else if (stem.stack instanceof Stack){
    util.merge(next, stem.stack);
    next.stack = stem.stack;
    next.handle = stem;
    delete next.match;
    // propagate arguments between stacks
    stem.stack.args = stack.args;
  } else {
    this.get(stem.path || stem.name || stem.displayName, next);
    next.handle = stem; next.depth = next.depth || 1;
  }

  // sync stack with next
  var chosen = stem.stack || stack;
  util.merge(next, {
    wait: stack.wait, // isolates the nested stack
    argv: stack.argv,
    args: chosen.args,
    stack: stack,
    result: chosen.result || null,
  });

  stack.index++;
  if(!stack.match){ stack.length++; }

  var self = this;
  function next(err){

    if(next.time && typeof next.time !== 'string'){
      next.time = util.prettyTime(process.hrtime(next.time));
      stack.pending = stack.pending.replace(next.match, '')
        .replace(/[ ]{2,}/g, ' ').trim();
      next.done = true;
    }

    // propagate and correct
    stack.wait = next.wait;
    next.time = next.time || process.hrtime();

    if(err){ // handle those errors
      err = err instanceof Error ? err : null;
      stack.error.call(stack.scope, err, next);
      stack.args = util.args(arguments, err ? 1 : 0);
    }

    // go next tick
    if(next.depth && next.argv[stack.length]){
      self.next(stack)();
    } else { stack.end = true; }

    stack.log(next);

    return stack.result;
  }

  // ↑ above `next`
  // ----------------------------------
  // ↓ below `tick`

  tick.stack = stack;
  function tick(arg){

    if(arg && arg.stack instanceof Stack){
      stack.log(next);
    } else if(stack.start){
      if(arguments.length){ stack.args = util.args(arguments); }
      stack.log(next);
    }

    util.asyncDone(function(){
      next.time = process.hrtime();
      var args = [next].concat(stack.args);
      stack.result = next.handle.apply(stack.scope, args);
      if(next.wait){ return stack.result; }

      // async-done checks
      var res = stack.result;
      res = !res || res.on || res.then || res.subscribe;
      if(typeof res === 'function'){ next.time = null; }
      next(); return res;
    }, next);

    return next;
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
