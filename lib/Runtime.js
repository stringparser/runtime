'use strict';

var util = require('./util');
var Stack = require('./Stack');
var __slice = Array.prototype.slice;

exports = module.exports = Runtime;

/**
# Runtime API
**/
function Runtime(props){
  if(!(this instanceof Runtime)){
    return new Runtime(props);
  }

  util.merge(this, props);
  this.Stack = Stack.createClass(this.constructor.prototype);
}

/**
 Missing docs
**/
Runtime.Stack = Stack;

/**
 Missing docs
**/
function reduceStack(self, calls, props){
  var stack = new self.Stack(util.merge({}, self, props));
  return stack.reduce.call(calls, function iterator(/* arguments */){
    stack.reduceStack.apply(stack, arguments);
    return stack;
  }, stack);
}

/**
  Missing docs
**/
Runtime.prototype.stack = function(/* sites..., props */) {
  var self = this;
  var calls = __slice.call(arguments);
  var props = util.type(calls[calls.length - 1]).plainObject && calls.pop();

  composer.stack = new this.Stack(props);
  composer.stack.tree = function stackTree(){
    return reduceStack(self, calls, props).tree();
  };

  function composer(host, next) {
    var stack = reduceStack(self, calls, props);

    stack.next = 0;
    stack.count = stack.length;

    stack.args = __slice.call(arguments);
    if(typeof arguments[arguments.length - 1] === 'function'){
      stack.onStackEnd = stack.args.pop();
    }

    return tick(stack);
  }

  function tick(stack){
    var site = stack[stack.next];
    var next = util.once(asyncEnd);
    var args = site.fn.stack instanceof Stack
      && stack.args.concat(next) || [next].concat(stack.args);

    next.wait = Boolean(stack.wait);
    stack.next = ++stack.next < stack.length && stack.next;

    util.asyncDone(function asyncStart(){
      stack.onHandle(site, stack);
      var ctxt = site.context || site;
      var result = site.fn.apply(ctxt, args);
      if(!next.wait && stack.next){ tick(stack); }
      return result;
    }, next);

    function asyncEnd(error){
      if(error instanceof Error){
        var handle = stack.onStackEnd || stack.onHandleError;
        handle.call(stack, error, site, stack, asyncEnd);
        stack.onStackEnd = null; // prevent stack overflow
        return;
      } else if(next.wait && arguments.length){
        util.mapFrom(stack.args, arguments, error && -1 || 0);
      }

      stack.end = !(--stack.count);
      stack.onHandle(site, stack);

      if(stack.next){ tick(stack); } else if(stack.end && stack.onStackEnd){
        stack.onStackEnd.apply(stack, [null].concat(stack.args));
      }
    }
  }

  return composer;
};
