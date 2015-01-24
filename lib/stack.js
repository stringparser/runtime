'use strict';

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
