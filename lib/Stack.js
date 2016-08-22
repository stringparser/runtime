'use strict';

var util = require('./util');

function Stack (sites) {
  if (!(this instanceof Stack)) {
    return new Stack(sites);
  }
  this.push.apply(this, sites);
}
util.inherits(Stack, Array);

/**
 Missing docs
**/
Stack.prototype.onHandleError = function (error) {
  throw error;
};

/**
 Missing docs
**/
Stack.prototype.onHandleStart = Stack.prototype.onHandleEnd = function () {};

/**
 Missing docs
**/
Stack.prototype.reduceStack = function (stack, site) {
  if (typeof site === 'function') {
    stack.push({fn: site});
  } else if (site && typeof site.fn === 'function') {
    stack.push(site);
  }
  return stack;
};

exports = module.exports = Stack;
