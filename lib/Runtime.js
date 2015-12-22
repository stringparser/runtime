'use strict';

var util = require('./util');
var Stack = require('./Stack');

exports = module.exports = Runtime;

/**
# Runtime API
**/
function Runtime(props){
  if(!(this instanceof Runtime)){
    return new Runtime(props);
  }

  util.merge(this, props);
}

/**
  Missing docs
**/
Runtime.prototype.stack = function(/* sites..., props */){
  var CallStack = this.Stack.createClass(
    util.merge({}, this.constructor.prototype, this)
  );

  composer.stack = new CallStack(arguments);

  if(!util.areFunctions(composer.stack.reduce())){
    throw new TypeError('stack empty: there are no sites in it');
  }

  var self = this;
  function composer(host, next){
    var stack = composer.stack.reduce();

    stack.next = 0;
    if(host instanceof Stack && typeof next === 'function'){
      stack.host = host;
      stack.args = host.wait && host.args || host.args.concat();
      stack.onStackEnd = stack.onHandleError = next;
    } else {
      stack.args = [].slice.call(arguments);
      if(typeof arguments[arguments.length-1] === 'function'){
        stack.onStackEnd = stack.onHandleError = stack.args.pop();
      }
    }

    return tick(stack);
  }

  // runs each handle
  function tick(stack){
    var site = stack[stack.next];
    var args = site.stack instanceof Stack
      && [stack, next] || [next].concat(stack.args);

    var index = stack.next;
    next.wait = Boolean(stack.wait);
    stack.next = ++stack.next < stack.length && stack.next;

    util.asyncDone(function callsite(){
      stack.onHandle(site, index, stack);
      var result = site.apply(stack.context || stack, args);
      if(!next.wait && stack.next){ tick(stack); }
      return result;
    }, next);

    function next(err){
      if(err instanceof Error){
        return stack.onHandleError(err, next, site, index, stack);
      } else if(next.wait && arguments.length){
        util.map(stack.args, arguments, err ? -1 : 0);
      }

      stack.end = !(--stack.count);
      stack.onHandle(site, index, stack);

      if(stack.next){ tick(stack); } else if(stack.end && stack.onStackEnd){
        stack.onStackEnd.apply(stack, [null].concat(stack.args));
      }
    }

    return self;
  }

  return composer;
};

/**
 Missing docs
**/
Runtime.Stack = Runtime.prototype.Stack = Stack;
