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

  // stack props
  app.get(this.path, this);

  // rootHandler: handle if not present
  if(typeof this.handle !== 'function'){
    this.handle = app.get().handle;
  }

  // defaults
  this.pending = this.path;
  this.argv = argv;
  this.args = [ ];
  this.wait = false;
  this.match = null;
  this.index = this.length = 0;

  // error handling stack-wise
  this.error = app.error.get(this.path).handle;
  if(typeof this.error !== 'function'){
    this.error = function(error){
      if(error){ throw error; }
    };
  }

  if(!app.log){ return this; }

  // logging stack-wise
  this.log = app.log.get(this.path).handle;
  if(typeof this.log !== 'function'){
    this.log = function rootLogger(next){
      var path = next.match || next.path;
      var main = next.handle.stack || next.stack;
      var status = next.time ? 'Finished' : 'Wait for';
      var time = next.time
        ? ('in ' + util.prettyTime(next.time)) : '';

      if(main.start){
        console.log('Stack `%s` dispatch started', main.path);
      }

      console.log('- %s `%s` %s', status, path, time);
    };
  }
}
