'use strict';

var util = require('./util');

exports = module.exports = Stack;

// ## Stack(app, args)
// > construct a consumable `stack` object
//
// arguments
//  * app, a `runtime` instance
//  * args, an `arguments` or `array` object
//
// return
//  * stack instance
//
// --
// api.private
// --
//
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
  var path = argv.reduce(function(prev, elem){
    var stem, type = typeof elem;
    if(!(/function|string/).test(type)){ // unsupported types
      throw new TypeError('argument should be `string` or `function`');
    }
    if(typeof elem === 'function'){
      stem = (elem.stack instanceof Stack && elem.stack.path)
        || elem.path || elem.name || elem.displayName;
    }
    stem = stem || elem;
    return prev ? prev + ' ' + stem : stem;
  }, '').trim();

  if(!app){ this.path = path; return this; }

  var node = argv[0].path || argv[0];
  if(typeof node === 'string'){
    app.get(node, opt);
  }

  var parent = app.get(opt.parent);
  opt.onHandle = app.store.log
    ? util.type(opt.onHandle).function || this.onHandle
    : function logginDisabled(){};

  opt.wait = opt.wait === void 0 ? app.store.wait : opt.wait;

  this.context = opt.context || this;
  Object.keys(opt).forEach(function(prop){
    if(!util.has(this, prop)){ this[prop] = opt[prop]; return ; }
    var value = util.type(opt[prop]).function || parent[prop];
    if(typeof value === 'function'){
      this[prop] = value;
    }
  }, this);

  // invariants
  util.defineFrozenProp(this, 'path', path);
  this.queue = path;
  this.argv = argv;
  this.match = null;
  this.index = 0;
  this.next = argv[0];
  this.app = app;
  this.repl = !util.type(app.repl).function && app.repl;
}

// ## stack.onHandle(next)
// > by default a logger
//
// arguments
//  - next, callback function from the runtime.stack method
//
// --
// api.public
// --
//
Stack.prototype.onHandle = function(next){
  var path = next.match || next.path;
  var time, status = next.time ? 'Finished' : 'Wait for';

  if(!next.time && !this.path.indexOf(next.match)){
    var host = this.host ? 'from `'+this.host.path+'`' : '';
    console.log('Started `%s` %s', this.path, host);
  } else if(next.handle && (next.time || !next.wait)){
    time = next.time ? util.prettyTime(process.hrtime(next.time)) : '';
    console.log('- %s `%s` %s', status, path, time);
  }

  var self = this;
  while(self && !self.queue){
    time = util.prettyTime(process.hrtime(self.time));
    console.log('Stack `%s` taked %s', self.path, time);
    self = self.host;
  }

  if(this.repl && !self && !self.queue){
    this.repl.prompt();
  }
};

// ## stack.onHandleError(err, next)
// > stack-wise error handler
//
// arguments
//  * err, an Error instance
//  * next, callback function from the runtime.stack method
//
// throws error
//
// --
// api.public
// --
Stack.prototype.onHandleError = function(err){
  if(err){ throw err; }
};

// ## stack.onHandleCall(next)
// > before handle
//
// arguments
//  * next, callback function from the runtime.stack method
//
// returns `undefined`
//
// --
// api.public
// --
//
Stack.prototype.onHandleCall = function(){};

// ## stack.onHandleEnd(next)
// > for stack start, before handle and after handle call
//
// arguments
//  * next, callback function from the runtime.stack method
//
// returns `undefined`
//
// --
// api.public
// --
//
Stack.prototype.onHandleEnd = function(){};

// ## stack.onHandleNotFound(err, next)
// > no handle was found
//
// arguments
//  * err, an Error instance
//  * next, callback function from the runtime.stack method
//
// throws error
//
// --
// api.public
// --

Stack.prototype.onHandleNotFound = function(next){
  var path = next.match || next.path;
  var message = 'no handle found for `'+path+'`.\n'+
    'Set one with `runtime.set('+ (path ? '\'' + path + '\', ' : path) +
    '[Function])`';

  if(!this.repl){ throw new Error(message); }
  this.repl.input.write('Warning: '+message+'\n');
  this.repl.prompt();
};
