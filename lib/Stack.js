'use strict';

var util = require('./util');

exports = module.exports = Stack;

function Stack(props){
  if(!(this instanceof Stack)){
    return new Stack(props);
  }

  util.merge(this, props);
}
util.inherits(Stack, Array);

/**
 Missing docs
**/
Stack.prototype.tree = function(options){
  options = options || {};

  var tree = {label: '', nodes: []};
  var sites = this.length ? this : this.reduce();
  var depth = options.depth === void 0 || options.depth;

  sites.forEach(function(task){
    if(!task || !task.fn){ return; }
    var node = task;

    if(task.fn.stack instanceof Stack){
      node = task.fn.stack.tree({
        host: task,
        depth: depth < options.depth && (depth + 1) || false
      });
    }

    tree.label += (tree.label && ', ' + node.label) || node.label;
    tree.nodes.push(node);
  });

  return tree;
};

/**
 Missing docs
**/
Stack.prototype.onHandleError = function(error){
  throw error;
};

/**
 Missing docs
**/
Stack.prototype.onHandleStart = Stack.prototype.onHandleEnd = function(){};

/**
 Missing docs
**/
Stack.prototype.reduceStack = function(stack, site){
  if(typeof site === 'function'){
    stack.push({fn: site});
  } else if(site && typeof site.fn === 'function'){
    stack.push(site);
  }
};

Stack.createClass = util.classFactory(Stack);
