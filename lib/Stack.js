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

  this.tree = function(){
    var tree = {
      label: this.wait ? 'series:(' : 'parallel:(',
      nodes: []
    };

    util.reduce(sites, function(prev, site, index){
      var node = site.stack instanceof Stack && site.stack.tree() || {
        label: site.displayName || site.name || index + ':anonymous'
      };
      prev.nodes.push(node);
      prev.label += (index && ' ' + node.label) || node.label;
      return prev;
    }, tree);

    tree.label += ')';
    return tree;
  };

  this.clone = function(){
    return new Stack(sites, props);
  };

  util.merge(this, util.clone(props, true));
}

/**
 Missing docs
**/
exports.createClass = util.classFactory(Stack);
