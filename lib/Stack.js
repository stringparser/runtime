'use strict';

var util = require('./util');

exports = module.exports = Stack;

function Stack(sites){
  if(!(this instanceof Stack)){
    return new Stack(sites);
  } else if(!util.type(sites).match(/array|arguments/)){
    throw new TypeError('Stack(sites) `sites` should be array or arguments');
  }

  var length = sites.length;
  var context = util.type(sites[length - 1]).plainObject;
  if(context){ --length; util.merge(this, context); } else { context = {}; }
  this.index = this.length = (this.args = []).length;

  for(var index = 0; index < length; ++index){
    var site = sites[index];
    if(!site || typeof site !== 'function'){
      throw new TypeError('`site` is not a function');
    }

    this.push(site);
    this.queue = this.queue
      ? this.queue + ' ' + this.siteID(site)
      : this.siteID(site);
  }

  Object.defineProperty(this, 'path', {value: this.queue});
}
util.inherits(Stack, Array);


Stack.prototype.siteID = function(site){
  if(!site.stack){
    return site.name || site.displayName || this.indexOf(site) + ':anonymous';
  }

  return '(' + site.stack.path + ')';
};

Stack.prototype.onHandle = function(){

};

Stack.prototype.onHandleError = function(err){
  if(err){ throw err; }
};
