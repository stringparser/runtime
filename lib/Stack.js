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
  if(context){ --length; } else { context = {}; }

  util.merge(this, context);
  this.args = [this];
  this.sites = sites;
  this.index = -1;
  this.length = length;

  for(var index = 0; index < length; ++index){
    var site = sites[index];

    if(!site || typeof site !== 'function'){
      throw new TypeError('site is not a function');
    }

    this.queue = this.queue
      ? this.queue + ' ' + this.siteID(site)
      : this.siteID(site);
  }
}

Stack.prototype.siteID = function(site){
  if(typeof site !== 'function'){ return -1; }
  if(!(site.stack instanceof Stack)){
    var id = site.name || site.displayName;
    if(id){ return id; }
  }

  var length = this.length;
  for(var index = 0; index < length; ++index){
    if(this.sites[index] === site){
      return index;
    }
  }
  return -1;
};

Stack.prototype.onHandle = function(){ };

Stack.prototype.onHandleError = function(err){
  throw err;
};
