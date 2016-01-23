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
  this.Stack = this.Stack.createClass(
    util.merge({}, this.constructor.prototype, this)
  );
}

/**
  Missing docs
**/
Runtime.prototype.stack = function(/* sites..., props */){
  var sites = util.reduce(arguments, this.reduceStack, [], this);
  if(!util.areFunctions(sites)){
    throw new TypeError('stack empty: there are no sites in it');
  }

  var self = this;
  var props = util.type(arguments[arguments.length-1]).plainObject;
  composer.stack = new self.Stack(sites, props);

  function composer(host, next){
    var proto = new self.Stack(sites, props);
    var stack = util.reduce(sites, self.reduceStack, proto, self);

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

    var isDone;
    function next(err){
      if(err instanceof Error){
        stack.onHandleError(err, next, site, index, stack);
        return self;
      }

      if(isDone){ return self; }
      if(next.wait && arguments.length){
        util.map(stack.args, arguments, err ? -1 : 0);
      }

      isDone = true;
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
    stack.push(site);
  }
};

Runtime.Stack = Runtime.prototype.Stack = Stack;
