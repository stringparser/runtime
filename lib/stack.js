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

function Stack(app, args){

  if(!(this instanceof Stack)){
    throw new Error('call Stack using `this`');
  } else if(!args){
    this.args = app;
    return this;
  }

  var opt, self = this;
  var argv = util.args(args);
  if(util.type(args[args.length-1]).plainObject){
    opt = argv.pop();
  }

  // form a string path
  // > useful for logging and other things
  this.path = '';
  argv.forEach(function(elem){
    var type = typeof elem;
    if(!(/function|string/).test(type)){ // unsupported types
      throw new TypeError('argument should be `string` or `function`');
    }

    if(typeof elem === 'function'){
      elem = elem.stack instanceof Stack && elem.stack.path
        || elem.path || elem.name || elem.displayName;
    }
    self.path += elem + ' ';
  });

  // this props
  app.get(this.path, this);
  this.argv = argv;

  // rootHandler: handle if not present
  if(typeof this.handle !== 'function'){
    this.handle = app.get().handle;
  }

  // defaults
  this.index = 0;
  this.args = [ ];
  this.wait = false;
  this.match = null;
  this.pending = this.path;

  // opts
  if(opt){ util.merge(this, opt); }

  this.next = this.argv[0];

  // error, logging, etc.
  this.note = app.note.get(this.stem).handle;
  if(typeof this.note !== 'function'){
    this.note = app.note.get().handle;
  }
}
