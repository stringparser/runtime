'use strict';

var util = require('./util');

exports = module.exports = Stack;

// ## stack.note(err, next)
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

function note(err, next){
  if(err){ throw err; }

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
    time = util.prettyTime(main.time);
    console.log('Stack `%s` ended in', path, time);
  }
}

// ## stack.handle(err, next)
// > default handle for notFounds
//
// arguments
//  - next: the next function created on runtime.stack
//
// throws an error
//
// --
// api.private
// --

function notFound(next){
  throw new Error(
    'No handle found for `'+next.path+'` path.\n'+
    'Set one with runtime.set([function])'
  );
}

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

function Stack(args, app, tick){

  if(!(this instanceof Stack)){
    throw new Error('call Stack using `new`');
  }

  var opt, argv = util.args(args);
  if(util.type(args[0]).plainObject){
    opt = argv.shift();
  }


  // form a string path
  // > useful for logging and other things
  this.path = argv.reduce(function(prev, elem){
    var path, type = typeof elem;
    if(!(/function|string/).test(type)){ // unsupported types
      throw new TypeError('argument should be `string` or `function`');
    } else if(typeof elem === 'function'){
      path = elem.stack instanceof Stack && elem.stack.path
        || elem.path || elem.name || elem.displayName;
    }
    path = path || elem;
    return prev ? prev + ' ' + path : path;
  }, '');

  if(!app){ return this; }

  // this props
  app.get(this.path || tick.stack.path, this);
  Object.defineProperty(this, 'path', {
    writable: false,
    enumerable: true,
    configurable: false,
    value: this.path
  });

  this.argv = argv;

  // rootHandler: handle if not present
  if(typeof this.handle !== 'function'){
    this.handle = app.get().handle;
  }

  this.wait = false;
  if(opt){ util.merge(this, opt); }

  // defaults
  this.index = 0;
  this.match = null;
  this.next = this.argv[0];
  this.pending = this.path;

  // notFounds go to the stack.handle
  if(typeof this.handle !== 'function'){
    this.handle = notFound;
  }

  // errors, logging, etc. go to stack.note
  if(typeof this.note !== 'function'){
    this.note = note;
  }
}
