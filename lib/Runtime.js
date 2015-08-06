'use strict';

var util = require('./util');
var Stack = require('./Stack');

exports = module.exports = Runtime;

function Runtime(){}

//
//
//
Runtime.prototype.compose = function compose(stack, callback){
  var sites, args, result;

  if(stack instanceof Stack){ tick(); } else {
    tick.stack = new Stack(arguments);
    sites = arguments;
    return tick;
  }

  function next(err){
    if(stack.onHandleError(err, next)){ return result; }
    if(next.wait && arguments.length > 1){
      util.args.map(stack.args, arguments, 1);
    }

    stack.queue = stack.queue.replace(stack.siteID(next.handle), '').trim();
    stack.onHandle.apply(stack, args);

    if(stack.next){ compose(stack, callback); }
    else if(stack.host.next){ compose(stack.host, callback); }
    else if(stack.host.queue){ stack.host.args[0].done(); }
    else if(callback){ callback.apply(stack, args); }

    return result;
  }

  function tick(arg){
    if(sites){
      stack = new Stack(sites);
      stack.host = ''; stack.index = 0; stack.queue = stack.path;
      if(arg && arg.host instanceof Stack){ stack.host = arg.host; }
      stack.args = util.args.slice(arguments, stack.host ? 0 : -1);
      return compose(stack, typeof stack.args[stack.length-1] === 'function' && stack.args.pop());
    }

    next.wait = Boolean(stack.wait);
    next.handle = stack[stack.index];
    stack.next = ++stack.index < stack.length;
    stack.args[0] = next.handle.stack instanceof Stack
      ? {host: stack, done: next}
      : next;

    args = stack.args.concat();
    util.asyncDone(function(){
      stack.onHandle.apply(stack, args);
      result = next.handle.apply(stack, args);
      if(next.wait){ return result; }
      if(stack.next){ compose(stack, callback); }
      if(stack.host.next){ compose(stack.host, callback); }
      return result;
    }, next);
  }
};
