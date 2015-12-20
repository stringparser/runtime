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
    fun = fun || this.reduceStack;
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
Stack.prototype.onHandle = function(){};

/**
 Missing docs
**/
Stack.prototype.onHandleError = function(err){
  throw err;
};

/**
 Missing docs
**/
Stack.prototype.reduceStack = function(stack, site){
  if(typeof site === 'function'){ stack.push(site); }
  return stack;
};

/**
 Missing docs
**/
exports.createClass = util.classFactory(Stack);
