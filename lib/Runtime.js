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
  this.Stack = this.constructor.Stack.createClass(
    util.merge({}, this.constructor.prototype, this)
  );
}

function reduceStack(self, calls, props){
  var proto = new self.Stack(util.merge({}, self, props));
  function iterator(/* arguments */){
    proto.reduceStack.apply(self, arguments);
    return proto;
  }
  return calls.reduce(iterator, proto);
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
    stack.next = 0; stack.count = stack.length;

    if(host instanceof Stack){
      stack.host = host;
      stack.args = host.wait && host.args || host.args.concat();
      stack.onStackEnd = stack.onHandleError = next;
    } else {
      stack.args = __slice.call(arguments);
      if(typeof arguments[arguments.length - 1] === 'function'){
        stack.onStackEnd = stack.onHandleError = stack.args.pop();
      }
    }

    return tick(stack);
  }

  function tick(stack){
    var site = stack[stack.next];
    var args = site.fn.stack instanceof Stack
      && [stack, next] || stack.args.concat(next);

    next.wait = Boolean(stack.wait);
    stack.next = ++stack.next < stack.length && stack.next;

    util.asyncDone(function asyncStart(){
      stack.onHandle(site, stack);
      var ctxt = site.context || stack.context || site;
      var result = site.fn.apply(ctxt, args);
      if(!next.wait && stack.next){ tick(stack); }
      return result;
    }, next);

    var isDone = false;
    function next(error){
      if(error){
        return stack.onHandleError(error, site, stack);
      }

      if(isDone){ return; } else if(next.wait && arguments.length){
        util.mapFrom(stack.args, arguments, 0);
      }

      isDone = true;
      stack.end = !(--stack.count);
      stack.onHandle(site, stack);

      if(stack.next){ tick(stack); } else if(stack.end && stack.onStackEnd){
        stack.onStackEnd.apply(self, [null].concat(stack.args));
      }
    }
  }

  return composer;
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

/**
 Missing docs
**/
Runtime.Stack = Stack;
