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
  this.Stack = this.Stack.createClass(
    util.merge({}, this.constructor.prototype, this)
  );
}

/**
 Missing docs
**/
Runtime.Stack = Runtime.prototype.Stack = Stack;

/**
  Missing docs
**/
Runtime.prototype.stack = function(/* sites..., props */) {
  var self = this;
  var sites = __slice.call(arguments);
  var props = util.type(sites[sites.length - 1]).plainObject && sites.pop();

  composer.stack = new this.Stack(props);
  composer.stack.reduce = function(){
    var stack = new self.Stack(props);
    for(var index = 0, length = sites.length; index < length; ++index){
      stack.reduceStack.call(self, stack, sites[index], index);
    }
    return stack;
  };

  function composer(host, next){
    var stack = composer.stack.reduce();

    if(host instanceof Stack && typeof next === 'function'){
      stack.host = host;
      stack.args = host.wait ? host.args : host.args.concat();
      stack.onHandleError = stack.onStackEnd = next;
    } else {
      stack.args = __slice.call(arguments);
      if(typeof arguments[arguments.length - 1] === 'function'){
        stack.onHandleError = stack.onStackEnd = stack.args.pop();
      }
    }

    return tick(stack, {
      index: -1,
      count: stack.length
    });
  }

  function tick(stack, o){
    var site = stack[++o.index];
    if (!site){ return; }

    var next = util.once(asyncEnd);
    var args = site.fn.stack instanceof Stack
      && [stack, next] || [next].concat(stack.args);

    next.wait = Boolean(stack.wait);

    util.asyncDone(function asyncStart(){
      stack.onHandleStart.call(self, site, stack);
      var ctxt = site.context || stack.context || site;
      var result = site.fn.apply(ctxt, args);
      if(!next.wait && stack[o.index + 1]){ tick(stack, o); }
      return result;
    }, next);

    function asyncEnd(error){
      if(error instanceof Error){
        stack.onHandleError.call(self, error, site, stack, asyncEnd);
        return;
      }

      if(next.wait && arguments.length){
        util.mapFrom(stack.args, arguments, error && -1 || 0);
      }

      stack.end = !o.count || !(--o.count);
      stack.onHandleEnd.call(self, site, stack);

      if(o.count && stack[o.index + 1]){
        tick(stack, o);
        return;
      }

      if(!o.count && stack.onStackEnd){
        stack.onStackEnd.apply(self, [null].concat(stack.args));
      }
    }
  }

  return composer;
};
