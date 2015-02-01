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
    return new Stack(app, args);
  } else if(app instanceof Stack){
    return util.merge(this, util.clone(app, true));
  }

  var opt = null, argv = util.args(args);
  if(util.type(args[args.length-1]).plainObject){ opt = argv.pop(); }

  // form a string path
  // > useful for logging and other things
  this.path = '';
  argv.forEach(function(elem){
    var type = typeof elem;
    if(!(/function|string/).test(type)){ // unsupported types
      throw new TypeError('argument should be `string` or `function`');
    }
    // 'function'.length > 'string'.length
    if(type.length > 6){
      elem = (elem.stack instanceof Stack && elem.stack.path)
      || elem.path || elem.name || elem.displayName;
    }
    this.path += elem + ' ';
  }, this);

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
  this.result = null;
  this.context = null;

  // opts
  if(opt){ util.merge(this, opt); }

  // error, logging, etc.
  this.note = app.note.get(this.path).handle;
  if(typeof this.note !== 'function'){
    this.note = app.note.get().handle;
  }
}
