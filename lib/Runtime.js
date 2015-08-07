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
Runtime.prototype.compose = function compose(stack, callback){
  var sites, args, result, self = this;

  if(stack instanceof Stack){ tick(); } else {
    tick.stack = new self.Stack(arguments);
    sites = arguments;
    return tick;
  }

  function next(err){
    if(err && self.onHandleError(err, next)){ return result; }
    if(next.wait && arguments.length > 1){
      util.mapFrom(stack.args, arguments, 1);
    }

    stack.queue = stack.queue.replace(stack.siteID(next.handle), '').trim();
    self.onHandle.apply(stack, args);

    if(stack.next){
      self.compose(stack, callback);
    } else if(stack.host){
      if(stack.host.next){
        self.compose(stack.host, callback);
      } else if(stack.host.queue){
        stack.host.done();
      }
    } else if(!stack.queue && callback){
      callback.apply(stack, stack.args);
    }

    return result;
  }

  function tick(arg){
    if(sites){
      args = arguments;
      stack = new self.Stack(sites);
      stack.index = 0;
      if(arg instanceof Stack){ stack.host = arg; }
      stack.args = util.slice(args, stack.host ? 1 : 0);
      return self.compose(stack, !stack.host &&
        util.type(args[args.length-1]).function &&
        stack.args.pop()
      );
    }

    next.wait = Boolean(stack.wait);
    next.handle = stack[stack.index];
    stack.next = util.type(stack[++stack.index]).function;

    if(next.handle.stack instanceof Stack){
      args = [stack].concat(stack.args);
      stack.done = next;
    } else {
      args = [next].concat(stack.args);
    }

    util.asyncDone(function(){
      self.onHandle.apply(stack, args);
      result = next.handle.apply(stack, args);
      if(next.wait || !stack.next && !stack.host){ return result; }
      if(stack.next){ self.compose(stack, callback); }
      else if(stack.host.next){ self.compose(stack.host, callback); }
      return result;
    }, next);
  }
};
