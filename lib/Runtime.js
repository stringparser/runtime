'use strict';

var util = require('./util');
var Stack = require('./Stack');

exports = module.exports = Runtime;

function Runtime(mixin){
  if(!(this instanceof Runtime)){
    return new Runtime(mixin);
  }

  util.merge(this, util.type(mixin).plainObject);
};

//
//
//
Runtime.prototype.Stack = Stack;

//
//
//
Runtime.prototype.onHandle = function(){ };
Runtime.prototype.onHandleError = function(err){ throw err; };

//
//
//
Runtime.prototype.compose = function(_handle, _stack){
  var fns = arguments;
  var self = this;

  // setup the stack
  composer.stack = new self.Stack();
  function composer(handle, stack, next){
    var stack = new self.Stack(fns); stack.host = 0;
    if(handle === composer){ stack.host = stack; }
    stack.args = stack.host ? stack.host.args.concat() : util.slice(arguments);
    stack.callback = typeof stack.args[stack.args.length-1] === 'function' && stack.args.pop();
    return tick(stack.pop(), stack);
  }

  // run the each callsite
  function tick(handle, stack){
    var result;

    next.wait = stack.wait;
    function next(err){
      if(err){ self.onHandleError(err, handle, next); }
      if(next.wait && arguments.length > 1){
        stack.args.push.apply(stack.args, util.slice(arguments, 1));
      }

      self.onHandle(handle, next);
      if(stack.length){ tick(stack.pop(), stack); }
      else if(stack.host.length){ tick(stack.host.pop(), stack.host); }
      else if(stack.callback){ stack.callback.apply(self, stack.args); }

      return result;
    }

    var args = handle.stack instanceof Stack
      ? [handle, stack, next]
      : stack.args.concat(next);

    util.asyncDone(function(){
      self.onHandle(handle, stack, next);
      result = handle.apply(self, args);
      if(next.wait){ return result; }
      if(stack.length){ tick(stack.pop(), stack); }
      if(stack.host.length){ tick(stack.host.pop(), stack.host); }
      return result;
    }, next);
  }

  return composer;
};
