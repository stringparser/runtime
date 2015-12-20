'use strict';

var util = require('./util');
var Stack = require('./Stack');

exports = module.exports = Runtime;

/**
# Runtime API
**/
function Runtime(mixin){
  if(!(this instanceof Runtime)){
    return new Runtime(mixin);
  }

  this.Stack = Stack.createClass(mixin);
}

/**
  Missing docs
**/
Runtime.prototype.stack = function(/* functions..., props */){
  composer.stack = new this.Stack(arguments);

  if(!util.areFunctions(composer.stack.reduce())){
    throw new TypeError('stack empty: there are no sites in it');
  }

  var self = this;
  function composer(/* arguments..., callback */){
    var stack = composer.stack.reduce();

    stack.next = 0;
    stack.args = [].slice.call(arguments);
    stack.context = stack.context || stack;

    if(typeof arguments[arguments.length-1] === 'function'){
      stack.onStackEnd = stack.onHandleError = stack.args.pop();
    }

    return tick(stack);
  }

  // runs each handle
  function tick(stack){
    var site = stack[stack.next];
    var args = site.stack instanceof Stack
      && stack.args.concat(next) || [next].concat(stack.args);

    var index = stack.next;
    next.wait = Boolean(stack.wait);
    stack.next = ++stack.next < stack.length && stack.next;

    util.asyncDone(function callsite(){
      stack.onHandle(site, index, stack);
      var result = site.apply(stack.context, args);
      if(!next.wait && stack.next){ tick(stack); }
      return result;
    }, next);

    var isDone = false;
    function next(err){
      if(isDone){ return; }

      isDone = true;
      if(err instanceof Error){
        stack.onHandleError(err, site, index, stack);
      }

      if(next.wait && arguments.length){
        util.map(stack.args, arguments, err ? -1 : 0);
      }

      stack.end = !(--stack.count);
      stack.onHandle(site, index, stack);

      if(stack.next){ tick(stack); }
      else if(stack.end && stack.onStackEnd){
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
Runtime.Stack = Stack;
