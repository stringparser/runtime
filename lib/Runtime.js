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

  if(props){ util.merge(this, props); }
}

/**
  Missing docs
**/
Runtime.prototype.stack = function(/* functions..., props */){
  var ref = arguments, self = this;
  var funcs = util.reduce(ref, this.reduceStack, [], this);
  var props = util.type(ref[ref.length-1]).plainObject || {};

  composer.stack = new this.Stack(funcs,
    util.merge({}, this.constructor.prototype, this, props)
  );

  function composer(/* arguments..., callback */){
    var clone = composer.stack.clone();
    var stack = composer.stack.reduce(self.reduceStack, clone, self);

    if(!stack || !stack.length){
      throw new TypeError('stack empty: there are no sites in it');
    }

    var sites = {
      next: 0,
      args: [].slice.call(arguments),
      count: stack.length,
      context: stack.context || self.context || self
    };

    if(typeof arguments[arguments.length-1] === 'function'){
      stack.onStackEnd = stack.onHandleError = sites.args.pop();
    }

    return tick(stack, sites);
  }

  // runs each handle
  function tick(stack, sites){
    var site = stack[sites.next];
    var args = site.stack instanceof self.Stack
      && sites.args.concat(next)
      || [next].concat(sites.args);

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
      } else if(next.wait && arguments.length){
        util.map(sites.args, arguments, err ? -1 : 0);
      }

      stack.end = !(--sites.count);
      stack.onHandle(site, index, stack);

      if(sites.next){ tick(stack, sites); }
      else if(stack.end && stack.onStackEnd){
        stack.onStackEnd.apply(self, [null].concat(sites.args));
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
  if(typeof site === 'function'){ stack.push(site); }
  return stack;
};

/**
 Missing docs
**/
Runtime.Stack = Runtime.prototype.Stack = Stack;
