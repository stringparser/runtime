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
Stack.prototype.tree = function() {

  function makeTree(tree, site, index) {
    if(!site || !site.fn){ return tree; }
    var node = site.fn.stack instanceof Stack && site.fn.stack.tree() || {
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
Stack.prototype.onHandle = function(){};

/**
 Missing docs
**/
Stack.prototype.onHandleError = function(error){
  throw error;
};

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
