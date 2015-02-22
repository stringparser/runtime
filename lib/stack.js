'use strict';

var util = require('./util');

exports = module.exports = Stack;

// ## stack.handle(err)
// > default handle for notFound handlers
//
// arguments
//  - err: an Error instance
//
// throws an error
//
// --
// api.private
// --

function notFound(err, next){
  var path = next.match;
  throw new Error(
    'no handle found for `'+path+'`.'+
    'Set one using runtime.set('+
      (path ? path + ', ' : path) + '[Function])'
  );
}

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
  /* jshint validthis: true */
  if(err){ throw err; }
  if(!this.log){ return ; }

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
  var path = argv[0].path || argv[0];
  if(typeof path === 'string'){
    app.get(path, this);
  }

  Object.defineProperty(this, 'path', {
    writable: false,
    enumerable: true,
    configurable: false,
    value: this.path
  });

  var root = app.get({ref: true});

  this.wait = false;
  if(opt){ util.merge(this, opt); }

  // defaults
  this.index = 0;
  this.argv = argv;
  this.match = null;
  this.next = this.argv[0];
  this.pending = this.path;

  // errors, logging, etc. go to stack.note
  this.note = util.type(this.note).function
    || util.type(root.note).function || note;

  // stack.handle for notFound
  this.handle = util.type(this.handle).function
    || util.type(root.handle).function || notFound;
}
