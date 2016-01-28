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

  this.onHandle = this.onHandle || function(){};
  this.onHandleError = this.onHandleError || function(error){ throw error; };
  if(props){ util.merge(this, props); }
}

/**
  Missing docs
**/
Runtime.prototype.stack = function(/* sites..., props */){
  var calls = [].slice.call(arguments);
  var props = util.merge({}, util.popLastObject(calls), this);
  var length = calls.length;

  composer.stack = new this.Stack(calls, props);

  // prepares the stack
  var self = this;
  function composer(/* arguments */){
    var stack = util.merge([], util.clone(props, true), self);

    stack.args = [].slice.call(arguments);
    if(typeof arguments[arguments.length-1] === 'function'){
      stack.onStackEnd = stack.onHandleError = stack.args.pop();
    }

    return tick(stack, {count: 1, next: 0});
  }

  // runs each handle
  function tick(stack, stem){
    self.reduceStack(stack, calls[stem.next]);

    var site = stack[stem.next];
    var args = stack.args.concat(next);

    next.wait = Boolean(stack.wait);
    stem.next = ++stem.next < length && stem.next;
    if(stem.next){ ++stem.count; }

    util.asyncDone(function callsite(){
      stack.onHandle.call(self, site, stack);
      var result = site.fn.apply(stack.context || stack, args);
      if(!next.wait && stem.next){ tick(stack, stem); }
      return result;
    }, next);

    var isDone = false;
    function next(error){
      if(isDone){ return; }
      if(error){
        stack.onHandleError.call(self, error, site, next);
        return;
      }

      if(next.wait && arguments.length > 1){
        util.mapFrom(stack.args, arguments, 0);
      }


      isDone = true;
      stack.end = !(--stem.count);
      stack.onHandle.call(self, site, stack);

      if(stem.next){ tick(stack, stem); }
      else if(stack.end && stack.onStackEnd){
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
Runtime.prototype.tree = function(calls){
  var stack = util.reduce(calls, this.reduceStack, [], this);
  return util.reduce(stack, function makeArchyTree(tree, site, index){
      if(!site || !site.fn){ return tree; }
      var node = site.fn.stack instanceof Runtime && site.fn.stack.tree() || {
        label: site.label || site.fn.displayName || site.fn.name || 'anonymous'
      };
      tree.nodes.push(node);
      tree.label += (index && ', ' + node.label) || node.label;
    }, {label: '', nodes: []}
  );
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
Runtime.Stack = Runtime.prototype.Stack = Stack;

/**
 Missing docs
**/
Runtime.createClass = util.classFactory(Runtime);
