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

Stack.createClass = util.classFactory(Stack);
