'use strict';

var util = require('./util');

exports = module.exports = Stack;

/**
  Missing docs
 */
function Stack(sites, pushSites){
  if(!(this instanceof Stack)){ return new Stack(sites); }
  if(!pushSites){ return this; }

  this.push.apply(this, sites);
}
util.inherits(Stack, Array);

/**
  Missing docs
 */
Stack.extend = util.classFactory(Stack);

/**
  Missing docs
 */
Object.defineProperty(Stack.prototype, 'super', {
  get: function(){
    return this.constructor.super_.prototype;
  }
});

/**
  Missing docs
 */
Stack.prototype.push = function (/* arguments */){
  if(!arguments.length){ return this; }

  var len = arguments.length;
  var props = arguments[len-1];
  if(util.type(props).plainObject){
    util.merge(this, props); --len;
  }

  for(var index = 0; index < len; ++index){
    var site = arguments[index];
    if(typeof site === 'function'){
      this.super.push.call(this, site);
    }
  }

  return this;
};
