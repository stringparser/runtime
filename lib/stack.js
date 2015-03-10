'use strict';

var util = require('./util');

exports = module.exports = Stack;

// handle life-cycle hooks
//
var handleHooks = [
  'onNotFound',
  'onError',
  'onCall',
  'onNext'
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
    throw new TypeError('cannot construct a stack without arguments');
  }

  var opt = { }, argv = util.args(args);
  if(util.type(args[args.length-1]).plainObject){
    opt = argv.pop();
  }

  // form a string path for the stack
  // > useful for logging and other things
  this.path = argv.reduce(function(prev, elem){
    var stem, type = typeof elem;
    if(!(/function|string/).test(type)){ // unsupported types
      throw new TypeError('argument should be `string` or `function`');
    } if(typeof elem === 'function'){
      stem = (elem.stack instanceof Stack && elem.stack.path)
       || elem.path || elem.name || elem.displayName;
    }
    stem = stem || elem;
    return prev ? prev + ' ' + stem : stem;
  }, '');

  if(!app){
    util.defineFrozenProperty(this, 'path');
    return this;
  }

  var node, firstStem = argv[0].path || argv[0];
  if(typeof firstStem === 'string'){ node = app.get(this.path); }

  var parent = app.get(node && node.parent);
  opt.log = app.store.log && (util.type(opt.log).function
    || util.type(parent.log || app.store.log).function
    || defaultLogger);

  if(node){ util.merge(node, opt); }
  Object.keys(opt).forEach(function(prop){
    var value = opt[prop];
    if(value !== void 0 && handleHooks.indexOf(prop) < 0){
      return (this[prop] = value); // statics
    }
    value = value || parent[prop];
    if(!value){ return; }
    if(typeof value === 'function'){
      this[prop] = value;
    }
    throw new TypeError('`stack.'+prop+'` should be a function');
  }, this);

  // invariants
  util.defineFrozenProperty(this, 'path');
  this.argv = argv;
  this.next = argv[0];
  this.pile = this.path;
  this.repl = util.type(app.repl).function ? false : app.repl;
  this.index = 0;
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
  if(this.log){ this.log(next); }
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
Stack.prototype.onNext = function(next){
  if(this.log){ this.log(next); }
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
