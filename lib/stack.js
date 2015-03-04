'use strict';

var util = require('./util');

exports = module.exports = Stack;

// ## Stack(app, args)
// > produce a consumable `stack` object
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
    throw new Error('call Stack using `new`');
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

  var root = app.store;
  app.get(this.path, this);
  if(opt){ util.merge(this, opt); }

  // defaults
  this.index = 0;
  this.argv = argv;
  this.match = null;
  this.next = argv[0];
  this.pending = this.path;
  Object.defineProperty(this, 'path', {
    writable: false,
    enumerable: true,
    configurable: false,
    value: this.path
  });

  // logging
  this.log = root.log && (util.type(this.log).function
    || util.type(root.log).function
    || defaultLogger
  );

  // errors
  this.error = util.type(this.error).function
    || util.type(root.error).function
    || errorHandleNotFound;

  var self = this;
  // error handling and logging
  this.console = function(error, next){
    if(error){ self.error(error, next); }
    if(this.log){ self.log(next); }
  };

  // stack.handle for notFounds
  this.handle = util.type(this.handle).function
    || util.type(root.handle).function
    || handleNotFound;
}

// ## stack.error(err, next)
// > default handle for errors and logging
//
// arguments
//  - err: an Error instance
//  - next: the next function created on runtime.stack
//
// returns `undefined`
//
// --
// api.private
// --

function errorHandleNotFound(error){
  throw error;
}

// ## stack.handle(err, next)
// > handle, when no handle was found for the given path
//
// throws error
//
// --
// api.private
// --

function handleNotFound(next){
  var path = next.match || next.path;
  var message = 'no handle found for `'+path+'`.'+
    'Set one using runtime.set('+ (path ? path + ', ' : path) +
    '[Function])';

  throw new Error(message);
}

// ## stack.log(err, next)
// > default logger
//
// arguments
//  - stack.args: all args passed
//
// returns `undefined`
//
// --
// api.private
// --

function defaultLogger(next){
  var main = next.stack;
  var host = next.stack.host;
  var path = next.match || next.path;
  var status = next.time ? 'Finished' : 'Wait for';
  var time = next.time ? ('in ' + util.prettyTime(next.time)) : '';

  if(host && !main.time){
    console.log('Host `%s` is dispatching stack `%s`', host.path, main.path);
  } else if(!main.time){
    console.log('Stack `%s` started', main.path);
  } else {
    console.log('- %s `%s` %s', status, path, time);
  }

  if(!main.pending){
    path = main.path;
    time = util.prettyTime(host.time || main.time);
    console.log('Stack `%s` ended in', path, time);
  }
}
