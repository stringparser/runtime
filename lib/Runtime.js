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
  if(props && props.Stack){ return this; }

  var mixin = util.merge({}, this.constructor.prototype, this);

  for(var key in mixin){
    if(mixin.hasOwnProperty(key) && !/^(wait|on)/.test(key)){
      delete mixin[key];
    }
  }

  this.Stack = this.Stack.createClass(mixin);
}

/**
  Missing docs
**/
Runtime.prototype.stack = function(/* sites..., props */){
  var calls = [].slice.call(arguments);
  var props = util.type(calls[calls.length-1]).plainObject && calls.pop();
  var sites = util.reduce(calls, this.reduceStack, new this.Stack(props), this);

  if(!sites.length){
    throw new Error('stack empty: there are no functions in it');
  }

  composer.stack = new this.Stack(sites, props);

  // prepares the stack
  var self = this;
  function composer(host, next){
    var stack = sites.clone();

    stack.next = 0;
    if(host instanceof Stack && typeof next === 'function'){
      stack.host = stack;
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
    var args = site.fn.stack instanceof Stack
      && [stack, next] || [next].concat(stack.args);

    next.wait = Boolean(stack.wait);
    stack.next = ++stack.next < stack.length && stack.next;

    util.asyncDone(function callsite(){
      stack.onHandle.call(self, site, stack);
      var result = site.fn.apply(stack.context || stack, args);
      if(!next.wait && stack.next){ tick(stack); }
      return result;
    }, next);

    var isDone = false;
    function next(error){
      if(isDone){ return; }
      if(error && error instanceof Error){
        stack.onHandleError.call(self, error, next, site, stack);
        return;
      }

      if(next.wait && arguments.length){
        util.map(stack.args, arguments, error ? -1 : 0);
      }

      isDone = true;
      stack.end = !(--stack.count);
      stack.onHandle.call(self, site, stack);

      if(stack.next){ tick(stack); } else if(stack.end && stack.onStackEnd){
        stack.onStackEnd.apply(self, [null].concat(stack.args));
      }
    }
    return self;
  }

  return composer;
};

/**
 Missing docs
**/
Runtime.prototype.onHandle = function(){};

/**
 Missing docs
**/
Runtime.prototype.onHandleError = function(err){
  throw err;
};

/**
 Missing docs
**/
Runtime.prototype.reduceStack = function(stack, site){
  if(typeof site === 'function'){
    stack.push({fn: site});
  } else if(site && typeof site.fn === 'function'){
    stack.push(site);
  }
};

Runtime.Stack = Runtime.prototype.Stack = Stack;
