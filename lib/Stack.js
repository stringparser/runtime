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

  util.merge(this, props);

  this.clone = function(){
    return new this.constructor(sites, props);
  };

  this.reduce = function(fn, acc, self){
    return util.reduce(sites, fn, acc || this.clone(), self);
  };
}
util.inherits(Stack, Array);

/**
 Missing docs
**/
Stack.prototype.tree = function(){
  var tree = {
    label: this.wait ? 'series:(' : 'parallel:(',
    nodes: []
  };

  this.reduce(function(stack, site, index){
    var node = site.stack instanceof Stack && site.stack.tree() || {
      label: site.displayName || site.name || index + ':anonymous'
    };
    stack.nodes.push(node);
    stack.label += (index && ' ' + node.label) || node.label;
    return stack;
  }, tree);

  tree.label += ')';
  return tree;
};

/**
 Missing docs
**/
exports.createClass = util.classFactory(Stack);
