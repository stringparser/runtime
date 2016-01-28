'use strict';

var util = require('./util');

exports = module.exports = Stack;

/**
  Missing docs
 */
function Stack(sites, props){
  if(!(this instanceof Stack)){
    return new Stack(sites, props);
  }

  props = props || sites;
  util.merge(this, props);

  this.tree = function(){
    return util.reduce(sites, function(tree, site, index){
      if(!site || !site.fn){ return tree; }
      var node = site.fn.stack instanceof Stack && site.fn.stack.tree() || {
        label: site.label || site.fn.displayName || site.fn.name || 'anonymous'
      };
      tree.nodes.push(node);
      tree.label += (index && ', ' + node.label) || node.label;
    }, {label: '', nodes: []});
  };
}
