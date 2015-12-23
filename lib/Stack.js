'use strict';

var util = require('./util');

exports = module.exports = Stack;

/**
  Missing docs
 */
function Stack(sites, props){
  if(!(this instanceof Stack)){
    return new Stack(sites, props);
  } else if(!props){
    sites = [].slice.call(sites);
    props = util.type(sites[sites.length-1]).plainObject && sites.pop() || {};
  }

  util.merge(this, props);

  this.clone = function(){
    return new this.constructor(sites, props);
  };

  this.reduce = function(fun, acc, self){
    acc = acc || this.clone();
    self = self || acc;
    return util.reduce(sites, fun, acc, self);
  };
}

/**
 Missing docs
**/
Stack.prototype.push = function(/* arguments */){
  Array.prototype.push.apply(this, arguments);
  if(typeof this.count !== 'number'){ this.count = 0; }
  this.count += arguments.length;
};

/**
 Missing docs
**/
Stack.prototype.tree = function(){
  return this.reduce(function(tree, site, index){
    var node = site.fn.stack instanceof Stack && site.fn.stack.tree() || {
      label: site.label || site.fn.name || 'anonymous'
    };
    tree.nodes.push(node);
    tree.label += (index && ' ' + node.label) || node.label;
    return tree;
  }, {label: '', nodes: []});
};

/**
 Missing docs
**/
exports.createClass = util.classFactory(Stack);
