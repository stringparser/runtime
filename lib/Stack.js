'use strict';

exports = module.exports = Stack;

/**
  Missing docs
 */
function Stack(sites){
  if(!(this instanceof Stack)){
    return new Stack(sites);
  }

  var tree;
  this.tree = function(){
    if(tree){ return tree; }
    tree = sites.reduce(function(prev, site, index){
      prev.nodes.push({
        label: siteID(site, index),
        nodes: site.stack instanceof Stack ? site.stack.tree().nodes : []
      });
      return prev;
    }, {nodes: []});

    tree.label = this.label();
    return tree;
  };

  var label;
  this.label = function(){
    if(label){ return label; }
    label = sites.reduce(function(prev, site, index){
      return prev ? prev + ' ' + siteID(site, index) : siteID(site, index);
    }, '');
    return label;
  };
}

function siteID(site, index){
  return site.stack instanceof Stack
    ? '(' + site.stack.label() + ')'
    : site.name || site.displayName || index + ':anonymous';
}
