'use strict';

var util = require('./util');
var Stack = require('./Stack');

exports = module.exports = Runtime;

function Runtime(){

}

Runtime.prototype.compose = function compose(stack){
  var sites, args, result;

  if(stack instanceof Stack){ tick(); } else {
    tick.stack = new Stack(arguments);
    sites = arguments;
    return tick;
  }

  function next(err){
    if(err){ stack.onHandleError(err, next, result); }
    if(next.wait && arguments.length > 1){
      util.map(arguments, 1, stack.args);
    }

    stack.queue = stack.queue.replace(stack.siteID(next.handle), '').trim();
    stack.onHandle.apply(stack, args);

    if(stack.next){ compose(stack); } else if(stack.host){
      if(stack.host.next){
        compose(stack.host);
      } else if(stack.host.queue){
        stack.host.args[0].done();
      }
    }

    return result;
  }

  function tick(arg){
    if(sites){
      stack = new Stack(sites);
      if(arg && arg[0] instanceof Stack){ stack.host = arg[0]; }
      util.map(stack.args, arguments, stack.host ? 0 : -1);
      return compose(stack);
    }

    next.wait = Boolean(stack.wait);
    next.handle = stack[stack.index];
    stack.next = ++stack.index < stack.length;
    stack.args[0] = next.handle.stack instanceof Stack
      ? {0: stack, done: next}
      : next;

    args = stack.args.concat();
    util.asyncDone(function(){
      stack.onHandle.apply(stack, args);
      result = next.handle.apply(stack, args);
      if(next.wait){ return result; }
      if(stack.next){ compose(stack); }
      else if(stack.host && stack.host.next){
        compose(stack.host);
      }
      return result;
    }, next);
  }
};
