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
