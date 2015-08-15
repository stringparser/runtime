'use strict';

var util = require('./util');
var Stack = require('./Stack');

exports = module.exports = Runtime;

/*
  Missing docs
**/
function Runtime(props){
  if(!(this instanceof Runtime)){
    return new Runtime(props);
  }

  util.merge(this, util.type(props).plainObject);
}

/**
  Missing docs
 */
Runtime.create = function create(props){
  return new Runtime(props);
};

Runtime.extend = util.classFactory(Runtime);
Runtime.prototype.Stack = Runtime.Stack = Stack;

/*
  Missing docs
**/
Runtime.prototype.onHandle = function(){ };
Runtime.prototype.onHandleError = function(err){ throw err; };

/*
  Missing docs
**/
Runtime.prototype.stack = function(/* functions... */){
  var fns = arguments;
  var self = this;

  composer.stack = new self.Stack(fns);
  // ^ mark the composer function so it can be identified
  function composer(handle, host, next){
    var stack = new self.Stack(fns, true);
    if(handle === composer){
      stack.host = host;
      stack.args = host.wait && host.args || [];
      stack.callback = next;
    } else {
      stack.args = util.slice(arguments);
      stack.callback = typeof arguments[arguments.length-1] === 'function' &&
        stack.args.pop() || self.onHandleError;
    }
    return tick(stack);
  }

  // runs each handle
  function tick(stack){
    var handle = stack[stack.index];
    var args = handle.stack instanceof Stack
      ? [handle, stack, next]
      : [next].concat(stack.args);

    next.wait = Boolean(stack.wait);
    stack.next = ++stack.index < stack.length;

    util.asyncDone(function onNext(){
      self.onHandle(next, handle, stack);
      var result = handle.apply(stack.context || self, args);
      if(next.wait){ return result; }
      if(stack.next){ tick(stack); }
      if(stack.host.next){ tick(stack.host); }
      return result;
    }, next);

    function next(err){
      if(err instanceof Error){
        stack.callback.apply(self, [err].concat(args));
      }

      if(next.wait && arguments.length){
        util.mapPush(stack.args, arguments, err instanceof Error ? 1 : 0);
      }

      next.end = true;
      stack.splice(stack.indexOf(handle), 1);
      self.onHandle(next, handle, stack);

      if(stack.next){ tick(stack); }
      else if(stack.host.next){ tick(stack.host); }
      else if(!stack.length && stack.callback){
        stack.callback.apply(self, [null].concat(stack.args));
      }
    }
  }

  return composer;
};
