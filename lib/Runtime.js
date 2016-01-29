'use strict';

var util = require('./util');

exports = module.exports = Runtime;

/**
# Runtime API
**/
function Runtime(props){
  if(!(this instanceof Runtime)){
    return new Runtime(props);
  }

  this.onHandle = this.onHandle || function(){};
  this.onHandleError = this.onHandleError || function(error){ throw error; };
  if(props){ util.merge(this, props); }
}

/**
  Missing docs
**/
Runtime.prototype.tree = function(calls){
  var stack = util.reduce(calls, this.reduceStack, [], this);
  return util.reduce(stack, function(tree, site, index){
    if(!site || !site.fn){ return tree; }
    var node = site.fn.stack instanceof Runtime && site.fn.stack.tree() || {
      label: site.label || site.fn.displayName || site.fn.name || 'anonymous'
    };
    tree.nodes.push(node);
    tree.label += (index && ', ' + node.label) || node.label;
  }, {label: '', nodes: []});
};

/**
  Missing docs
**/
Runtime.prototype.stack = function(/* sites..., props */){
  var calls = [].slice.call(arguments);
  var mixin = util.merge({}, this, util.popLastObject(calls));
  var length = calls.length;

  composer.stack = new this.constructor(mixin);
  composer.stack.tree = this.tree.bind(this, calls);

  var self = this;
  function composer(/* arguments */){
    var stem = {count: 1, next: 0};
    var stack = util.merge([], new self.constructor(mixin));

    stem.args = [].slice.call(arguments);
    if(typeof arguments[arguments.length-1] === 'function'){
      stack.onStackEnd = stack.onHandleError = stem.args.pop();
    }

    return tick(stack, stem);
  }

  // runs each handle
  function tick(stack, stem){
    self.reduceStack(stack, calls[stem.next]);

    var site = stack[stem.next];
    var args = stem.args.concat(next);

    next.wait = Boolean(stack.wait);
    stem.next = ++stem.next < length && stem.next;
    if(stem.next){ ++stem.count; }

    util.asyncDone(function callsite(){
      stack.onHandle(site, stack);
      var ctxt = stack.context || stack;
      var result = site.fn.apply(ctxt, args);
      if(!next.wait && stem.next){ tick(stack, stem); }
      return result;
    }, next);

    var isDone = false;
    function next(error){
      if(isDone){ return; } else if(error){
        stack.onHandleError(error, site, next);
        return;
      } else if(next.wait && arguments.length > 1){
        util.mapFrom(stem.args, arguments, 0);
      }

      isDone = true;
      stack.end = !(--stem.count);
      stack.onHandle(site, stack);

      if(stem.next){ tick(stack, stem); }
      else if(stack.end && stack.onStackEnd){
        stack.onStackEnd.apply(stack, [null].concat(stem.args));
      }
    }
    return self;
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
Runtime.createClass = util.classFactory(Runtime);
