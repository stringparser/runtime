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
  function composer(next, handle, host){
    var args = arguments;
    var stack = new self.Stack(fns, true);
    if(handle === composer){ // nested
      stack.host = host;
      stack.args = host.args.concat();
      stack.callback = next;
    } else {
      stack.host = stack.host || 0; // just so stack.host.length does not throw
      stack.args = util.slice(args);
      stack.callback = typeof args[args.length-1] === 'function' && stack.args.pop() || self.onHandleError;
    }
    stack.index = stack.length;
    return tick(stack[--stack.index], stack);
  }

  // run the each callsite
  function tick(handle, stack){

    var args = handle.stack instanceof self.Stack
      ? [next, handle, stack]
      : [next].concat(stack.args);

    util.asyncDone(function onNext(){
      next.wait = Boolean(stack.wait);
      self.onHandle(next, handle, stack);
      var result = handle.apply(stack, args);
      if(next.wait){ return result; }
      if(stack.index){
        tick(stack[--stack.index], stack);
      } else if(stack.host.index){
        tick(stack.host[--stack.index], stack.host);
      }
      return result;
    }, next);

    function next(err){
      if(err){ stack.callback.apply(self, [err].concat(stack.args)); }
      if(next.wait && arguments > 1){
        util.mapFrom(stack.args, arguments, 1);
      }

      stack.splice(stack.indexOf(handle), 1);
      self.onHandle(next, handle, stack);

      if(stack.index){
        tick(stack[--stack.index], stack);
      } else if(stack.host.index){
        tick(stack.host[--stack.host.index], stack.host);
      } else if(!stack.length && stack.callback){
        stack.callback.apply(self, [null].concat(stack.args));
      }
    }
  }

  return composer;
};
