'use strict';

var util = require('./util');

exports = module.exports = Stack;

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

  this.path = '';
  if(util.type(args[0]).array){ args = args[0]; }

  var opt = null;
  var argv = util.args(args);
  if(util.type(args[args.length-1]).plainObject){
    opt = argv.pop();
  }

  // extract string path
  argv.forEach(function(elem){
    var type = typeof elem;
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
  }, this);

  // stack props
  app.get(this.path, this);
  this.argv = argv;

  // rootHandler: handle if not present
  if(typeof this.handle !== 'function'){
    this.handle = app.get().handle;
  }

  // defaults
  this.pending = this.path;
  this.args = [ ];
  this.wait = false;
  this.match = null;
  this.length = 0;

  // opts
  if(opt){ util.merge(this, opt); }

  // errors stack-wise
  this.error = app.error.get(this.path).handle;
  if(typeof this.error !== 'function'){
    this.error = app.error.get().handle;
  }

  // logging stack-wise
  if(!app.log){ return this; }

  this.log = app.log.get(this.path).handle;
  if(typeof this.log !== 'function'){
    this.log = app.log.get().handle;
  }
}
