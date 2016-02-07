'use strict';

var util = require('./util');
var _slice = Array.prototype.slice;

exports = module.exports = Runtime;

/**
# Runtime API
**/
function Runtime(props){
  if(!(this instanceof Runtime)){
    return new Runtime(props);
  }

  if(props){
    util.merge(this, props);
  }
}

/**
  Missing docs
**/
Runtime.prototype.tree = function() {
  if(!Array.isArray(this)) { return {}; }

  function makeTree(tree, site, index) {
    if(!site || !site.fn){ return tree; }
    var node = site.fn.stack instanceof Runtime && site.fn.stack.tree() || {
      label: site.label || site.fn.displayName || site.fn.name || 'anonymous'
    };
    tree.nodes.push(node);
    tree.label += (index && ', ' + node.label) || node.label;
    return tree;
  }

  return this.reduce(makeTree, {label: '', nodes: []});
};

/**
 Missing docs
**/
function createMixin(self, calls){
  var proto = self.constructor.prototype;
  var props = util.type(calls[calls.length - 1]).plainObject && calls.pop();
  return util.merge({}, proto, self, props);
}

/**
  Missing docs
**/
function reduceStack(self, calls, mixin) {
  var proto = util.merge([], mixin);
  return calls.reduce(function iterator(/* arguments */) {
    var result = proto.reduceStack.apply(self, arguments);
    return result || proto;
  }, proto);
}

/**
  Missing docs
**/
Runtime.prototype.stack = function(/* sites..., props */) {
  var self = this;
  var calls = _slice.call(arguments);
  var mixin = createMixin(self, calls);

  composer.tree = function stackTree(){
    return reduceStack(self, calls, mixin).tree();
  };

  function composer(/* arguments */) {
    var stack = reduceStack(self, calls, mixin);

    stack.args = _slice.call(arguments);
    stack.next = 0; stack.count = stack.length;
    if(typeof arguments[arguments.length - 1] === 'function'){
      stack.onStackEnd = stack.onHandleError = stack.args.pop();
    }

    return tick(stack);
  }

  function tick(stack){
    var site = stack[stack.next];
    var next = util.once(onNext);
    var args = stack.args.concat(next);

    stack.next = ++stack.next < stack.length && stack.next;

    util.asyncDone(function asyncStart(){
      next.wait = Boolean(stack.wait);
      stack.onHandle(site, stack);
      var ctxt = site.context || stack.context || site;
      var result = site.fn.apply(ctxt, args);
      if(!next.wait && stack.next){ tick(stack); }
      return result;
    }, next);

    function onNext(error){
      if(error){
        stack.onHandleError(error, site, stack);
      } else if(next.wait && arguments.length > 1){
        util.mapFrom(stack.args, arguments, 0);
      }

      stack.end = !(--stack.count);
      stack.onHandle(site, stack);

      if(stack.next){
        tick(stack);
      } else if(stack.end && stack.onStackEnd){
        stack.onStackEnd.apply(stack, [null].concat(stack.args));
      }
    }
  }

  return composer;
};

/**
 Missing docs
**/
Runtime.prototype.onHandle = function(){};
Runtime.prototype.onHandleError = function(error){
  throw error;
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
