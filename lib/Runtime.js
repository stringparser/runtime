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

//
//
//
Runtime.prototype.onHandleError = function(err){ throw err; };

//
//
//
Runtime.prototype.compose = function compose(/* functions... */){
  var fns = arguments, self = this, start = true;
  function tick(handle, stack, next){
    if(start){
      stack = new self.Stack(fns, true);
      stack.host = 0; var args = arguments;
      if(handle === tick){ stack.host = stack; }
      stack.args = util.slice(args, stack.host ? 1 : 0);
      stack.callback = stack.host && stack.host.callback ||
        util.type(args[args.length-1]).function && stack.args.pop();
      return tick(stack[0], stack);
    }

    next.wait = Boolean(stack.wait);
    stack.next = stack[stack.indexOf(handle) + 1];
    if(handle.stack instanceof Stack){
      args = [stack.next, stack, next];
    } else {
      args = stack.args.concat(next);
    }

    var result;
    util.asyncDone(function(){
      self.onHandle(handle, stack, next);
      result = handle.apply(stack, args);
      if(next.wait){ return result; }
      if(stack.next){ tick(stack, stack.next); }
      if(stack.host.next){ tick(stack.host, stack.host.next); }
      return result;
    }, next);

    function next(err){
      if(err && self.onHandleError(err, handle, stack)){ return result; }
      if(next.wait && arguments.length > 1){
        stack.args.push.apply(stack.args, util.slice(arguments, 1));
      }

      self.onHandle(handle, stack, next);
      stack.splice(stack.indexOf(handle), 1);
      if(stack.length){ tick(stack[0], stack); }
      else if(stack.host.length){ tick(stack.host[0], stack.host); }
      else if(stack.callback){ start = true; stack.callback.apply(stack, stack.args); }
      return result;
    }
  }

  tick.stack = new self.Stack(fns);
  return tick;
};
