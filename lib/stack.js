'use strict';

var util = require('./util');

exports = module.exports = Stack;

// stack life-cycle hooks
//
var stackHooks = [
  'onNotFound',
  'onError',
  'onCall',
  'onEnd',
  'onLog'
];

// ## Stack(app, args)
// > construct a consumable `stack` object
//
// arguments
//  - app: a `runtime` instance
//  - args: an `arguments` or `array` object
//
// return
//
// --
// api.private
// --

function Stack(args, app){

  if(!(this instanceof Stack)){
    throw new SyntaxError('call Stack using `new`');
  } else if(args.length === 0){
    throw new TypeError('cannot construct a stack with no arguments');
  }

  var opt = { }, argv = util.args(args);
  if(util.type(args[args.length-1]).plainObject){
    opt = argv.pop();
  }

  // form a string path
  // > useful for logging and other things
  this.path = argv.reduce(function(prev, elem){
    var path, type = typeof elem;
    if(!(/function|string/).test(type)){ // unsupported types
      throw new TypeError('argument should be `string` or `function`');
    } if(typeof elem === 'function'){
      path = (elem.stack instanceof Stack && elem.stack.path)
       || elem.path || elem.name || elem.displayName;
    }
    path = path || elem;
    return prev ? prev + ' ' + path : path;
  }, '');

  if(!app){ return this; }
  var firstStem = argv[0].path || argv[0];
  if(typeof firstStem === 'string'){ app.get(this.path, this); }
  Object.defineProperty(this, 'path',{
    configurable: false,
    enumerable: true,
    writable: false,
    value: this.path
  });

  // invariants
  this.argv = argv;
  this.next = argv[0];
  this.pile = this.path;
  this.repl = util.type(app.repl).function ? false : app.repl;
  this.match = null;
  this.index = 0;

  var parent = app.get(this.parent);
  this.onLog = app.store.log && (util.type(this.onLog).function
    || util.type(parent.onLog || app.store.log).function
    || defaultLogger);

  if(!opt){ return this; }
  if(opt.onLog){ opt.onLog = null; }
  Object.keys(opt).forEach(function(prop){
    if(!util.has(this, prop) && stackHooks.indexOf(prop) < 0){
      return (this[prop] = opt[prop]); // statics
    }
    var handle = opt[prop] || this[prop] || parent[prop];
    if(!handle){ return; }
    if(typeof handle !== 'function'){
      throw new TypeError('stack.'+prop+' should be a function');
    } else {
      this[prop] = handle;
    }
  }, this);
}

// ## stack.onNotFound(err, next)
// > handle wasn't found
//
// arguments
//  - err, an Error instance
//  - next, callback function from the runtime.stack method
//
// throws error
//
// --
// api.public
// --

Stack.prototype.onNotFound = function(next){
  var path = next.match || next.path;
  var message = 'no handle found for `'+path+'`.\n'+
    'Set one with `runtime.set('+ (path ? '\'' + path + '\', ' : path) +
    '[Function])`';

  if(!this.repl){ throw new Error(message); }
  this.repl.input.write('Warning: '+message+'\n');
  this.repl.prompt();
};

// ## stack.onError(err, next)
// > default handle for errors and logging
//
// arguments
//  - err, an Error instance
//  - next, callback function from the runtime.stack method
//
// throws error
//
// --
// api.public
// --
Stack.prototype.onError = function(err){
  if(err){ throw err; }
};

// ## stack.onCall(err, next)
// > default logger
//
// arguments
//  - stack.args, all args passed
//
// returns `undefined`
//
// --
// api.public
// --
//
Stack.prototype.onCall = function(next){
  if(this.onLog){ this.onLog(next); }
};

// ## stack.log(err, next)
// > default logger
//
// arguments
//  - stack.args, all args passed
//
// returns `undefined`
//
// --
// api.public
// --
//
Stack.prototype.onEnd = function(next){
  if(this.onLog){ this.onLog(next); }
};

// ## stack.onLog(err, next)
// > default logger
//
// arguments
//  - next, the callback function
//
// returns `undefined`
//
// --
// api.public
// --
//
function defaultLogger(next){
  /* jshint validthis: true */
  var path = next.match || next.path;
  var time, status = next.time ? 'Finished' : 'Wait for';

  if(!this.time){
    console.log('Starting `%s`', this.path);
  } else if(next.time){
    time = next.time ? util.prettyTime(process.hrtime(next.time)) : '';
    console.log('- %s `%s` %s', status, path, time);
  }

  var self = this;
  while(self && !self.pile){
    time = util.prettyTime(process.hrtime(self.time));
    console.log('Finished `%s` in `%s`', self.path, time);
    self = self.host;
  }

  if(this.repl && !self && !self.pile){
    this.repl.prompt();
  }
}
