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
  function composer(next, handle, stack){
    var stack = new self.Stack(fns);
    if(handle === composer){ // called from other stack; see below
      stack.host = stack;
      stack.args = stack.host.args || [];
      console.log('nested!', stack);
    } else { // not nested
      var last = arguments.length-1;
      stack.host = 0; // just so stack.host.length does not throw
      stack.callback = !stack.host && typeof arguments[last] === 'function' && arguments[last];
      stack.args = stack.callback ? util.slice(arguments, 0, last) : util.slice(arguments);
    }
    return tick(stack.pop(), stack);
  }

  // run the each callsite
  function tick(handle, stack){
    var args = handle.stack instanceof self.Stack
      ? [next, handle, stack]
      : [next].concat(stack.args);

    var next;
    util.asyncDone(function onNext(done){
      next = done; args[0] = done;
      next.wait = Boolean(stack.wait);
      self.onHandle(handle, stack, next);
      var result = handle.apply(stack, args);
      if(next.wait){ return result; }
      if(stack.length){ tick(stack.pop(), stack); }
      else if(stack.host.length){ tick(stack.host.pop(), stack.host); }
      return result;
    }, function onDone(err){
      if(err && self.onHandleError(err, handle, stack, next)){ return; }
      if(next.wait && arguments.length > 1){
        util.mapFrom(stack.args, arguments, 1);
      }

      self.onHandle(handle, next);

      if(stack.length){
        return tick(stack.pop(), stack);
      } else if(stack.host.length){
        tick(stack.host.pop(), stack.host);
      } else if(stack.callback){
        stack.callback.apply(self, stack.args);
      }
    });
  }

  return composer;
};
