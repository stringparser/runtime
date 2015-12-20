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
  var self = this;
  var props = util.type(arguments[arguments.length-1]).plainObject;

  composer.stack = new this.Stack(arguments, props);
  if(!util.areFunctions(composer.stack.reduce())){
    throw new TypeError('stack empty: there are no sites in it');
  }

  function composer(/* arguments..., callback */){
    var stack = composer.stack.reduce();
    var sites = {next: 0, count: stack.length};

    sites.args = [].slice.call(arguments);
    sites.context = stack.context || stack;

    if(typeof arguments[arguments.length-1] === 'function'){
      stack.onStackEnd = stack.onHandleError = sites.args.pop();
    }

    return tick(stack, sites);
  }

  // runs each handle
  function tick(stack, sites){
    var site = stack[sites.next];
    var args = site.stack instanceof Stack
      && sites.args.concat(next) || [next].concat(sites.args);

    var index = sites.next;
    next.wait = Boolean(stack.wait);
    sites.next = ++sites.next < stack.length && sites.next;

    util.asyncDone(function callsite(){
      stack.onHandle(site, index, stack);
      var result = site.apply(sites.context, args);
      if(!next.wait && sites.next){ tick(stack, sites); }
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
        util.map(sites.args, arguments, err ? -1 : 0);
      }

      stack.end = !(--sites.count);
      stack.onHandle(site, index, stack);

      if(sites.next){ tick(stack, sites); }
      else if(!sites.count && stack.onStackEnd){
        stack.onStackEnd.apply(stack, [null].concat(sites.args));
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
