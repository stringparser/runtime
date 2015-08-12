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
};

/*
  Missing docs
**/
Runtime.prototype.Stack = Stack;

/*
  Missing docs
**/
Runtime.prototype.onHandle = function(){ };

/*
  Missing docs
**/
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
      stack.callback = typeof arguments[arguments.length-1] === 'function' && stack.args.pop() || self.onHandleError;
    }
    return tick(stack);
  }

  // runs each handle
  function tick(stack){
    var handle = fns[stack.index];
    if(typeof handle !== 'function'){
      throw new TypeError('handle ' + handle + ' is not a function\n stack: ' + fns);
    }

    var args = handle.stack instanceof self.Stack
      ? [handle, stack, next]
      : [next].concat(stack.args);

    stack.next = ++stack.index < stack.length;

    util.asyncDone(function onNext(){
      next.wait = Boolean(stack.wait);
      self.onHandle(next, handle, stack);
      var result = handle.apply(stack.context || self, args);
      if(next.wait){ return result; }
      if(stack.next){ tick(stack); }
      if(stack.host.next){ tick(stack.host); }
      return result;
    }, next);

    function next(err){
      if(err){ return stack.callback.apply(self, [err].concat(args)); }
      if(next.wait && arguments.length > 1){
        util.mapPush(stack.args, arguments, 1);
      }

      next.end = true; --stack.queue;
      self.onHandle(next, handle, stack);

      if(stack.next){ tick(stack); }
      else if(stack.host.next){ tick(stack.host); }
      else if(!stack.queue && stack.callback){
        stack.callback.apply(self, [null].concat(stack.args));
      }
    }
  }

  return composer;
};
