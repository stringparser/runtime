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
  }, '');

  if(!app){
    util.defineFrozenProp(this, 'path', path);
    return this;
  }

  if(typeof (argv[0].path || argv[0]) === 'string'){
    app.get(path, opt);
  }

  var parent = app.get(opt.parent);
  opt.log = app.store.log && (
    util.type(opt.log || parent.log || app.store.log).function
    || this.log
  );

  this.context = this;
  Object.keys(opt).forEach(function(prop){
    if(!util.has(this, prop)){ this[prop] = opt[prop]; return ; }
    var value = util.type(opt[prop]).function || parent[prop];
    if(typeof value === 'function'){
      this[prop] = value;
    } else if(value){
      throw new TypeError('`stack.'+prop+'` should be a function');
    }
  }, this);

  // invariants
  util.defineFrozenProp(this, 'path', path);
  this.pile = path;
  this.argv = argv;
  this.next = argv[0];
  this.repl = !util.type(app.repl).function && app.repl;
  this.index = 0;
  this.match = null;
}

// ## stack.onNotFound(err, next)
// > used when a handle wasn't found
//
// arguments
//  - err, an Error instance
//  - next, callback function from the runtime.stack method
//
// throws error
//
// --
// api.public
// --

Stack.prototype.onNotFound = function(next){
  var path = next.match || next.path;
  var message = 'no handle found for `'+path+'`.\n'+
    'Set one with `runtime.set('+ (path ? '\'' + path + '\', ' : path) +
    '[Function])`';

  if(!this.repl){ throw new Error(message); }
  this.repl.input.write('Warning: '+message+'\n');
  this.repl.prompt();
};

// ## stack.onError(err, next)
// > stack-wise error handler
//
// arguments
//  - err, an Error instance
//  - next, callback function from the runtime.stack method
//
// throws error
//
// --
// api.public
// --
Stack.prototype.onError = function(err){
  if(err){ throw err; }
};

// ## stack.onCall(next)
// > for stack start, before handle and after handle call
//
// arguments
//  - next, callback function from the runtime.stack method
//
// returns `undefined`
//
// --
// api.public
// --
//
Stack.prototype.onCall = function(next){
  if(this.log){ this.log(next); }
};

// ## stack.log(next)
// > default logger
//
// arguments
//  - next, callback function from the runtime.stack method
//
// --
// api.public
// --
//
Stack.prototype.log = function defaultLogger(next){
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

  if(this.repl && !self && !self.pile){
    this.repl.prompt();
  }
};
