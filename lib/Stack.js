'use strict';

var util = require('./util');

exports = module.exports = Stack;

/**
  Missing docs
 */

function Stack(sites, shouldHaveProps){
  if(!(this instanceof Stack)){ return new Stack(sites); }
  if(!arguments.length || !shouldHaveProps){ return this; }

  var length = sites.length;
  var props = sites[length-1];
  if(util.type(props).plainObject){
    util.merge(this, props); --length;
  }

  // instance properties meaning
  // host, should be there to make this.host.prop checks
  // index, iterates the stack
  // queue, decreasing count of completed functions
  // length, stack length without the options

  this.host = false;
  this.index = 0;
  this.queue = length;
  this.length = length;
}
