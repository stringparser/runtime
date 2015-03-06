'use strict';

var util = require('./util');

exports = module.exports = Stack;

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

// Stack hooks
//
var hooks = [
  'onHandle',
  'onNext',
  'onError',
  'onEnd',
  'handle',
  'log',
];

function Stack(args, app){

  if(!(this instanceof Stack)){
    throw new SyntaxError('call Stack using `new`');
  }

  var opt, argv = util.args(args);
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

  app.get(this.path, this);

  var root = app.store;
  var parent = app.get(this.parent);

  Object.defineProperty(this, 'path', {
    writable: false,
    enumerable: true,
    configurable: false,
    value: this.path
  });


  if(opt){

    opt.log = root.log && (util.type(opt.log).function
      || util.type(parent.log || root.log).function || defaultLogger
    );

    Object.keys(opt).forEach(function(name){
      if(hooks.indexOf(name) < 0){
        return (this[name] = opt[name]); // statics
      }

      var handle = util.type(opt[name]).function
        || parent[name] || root[name];
      if(!handle){ return; }
      if(typeof handle !== 'function'){
        throw new TypeError('Stack handle `'+name+'` should be a function');
      } else {
        this[name] = handle;
      }
    }, this);
  }

  // invariants
  this.index = 0;
  this.argv = argv;
  this.match = null;
  this.next = argv[0];
  this.pile = this.path;
  if(!this.log){ return this; }
  this.onHandle = this.onHandle || function(next){
    if(!this.log){ return ; } this.log(next);
    next.time = process.hrtime();
    this.time = this.time || process.hrtime();
  };
}

// ## stack.error(err, next)
// > default handle for errors and logging
//
// arguments
//  - err, an Error instance
//  - next, the next function created on runtime.stack
//
// throws error
//
// --
// api.public
// --

Stack.prototype.handle = function(next){
  var path = next.match || next.path;
  var message = 'no handle found for `'+path+'`.'+
    'Set one using runtime.set('+ (path ? path + ', ' : path) +
    '[Function])';

  throw new Error(message);
};

// ## stack.error(err, next)
// > default handle for errors and logging
//
// arguments
//  - err, an Error instance
//  - next, the next function created on runtime.stack
//
// throws error
//
// --
// api.public
// --
Stack.prototype.onError = function(err){
  if(err){ throw err; }
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
Stack.prototype.onNext = function(next){
  var stack = this;
  this.pile = this.pile.replace(next.match, '').trim();
  while(!stack.pile && stack.host){
    stack.host.pile = stack.host.pile.replace(stack.path, '').trim();
    stack = stack.host;
  }
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
}
