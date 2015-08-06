'use strict';

var util = require('./util');

exports = module.exports = Stack;

function Stack(sites){
  if(!(this instanceof Stack)){ return new Stack(sites); }
  if(!arguments.length || !sites || !sites.length){ return this; }

  var length = sites.length;
  var context = sites[length - 1];
  if(util.type(context).plainObject){
    --length; util.merge(this, context);
  }

  for(var index = 0; index < length; ++index){
    var site = sites[index];
    if(typeof site !== 'function'){
      throw new TypeError('`site` is not a function');
    }

    this.push(site);
    this.path = this.path
      ? this.path + ' ' + this.siteID(site)
      : this.siteID(site);
  }

  Object.defineProperty(this, 'path', {value: this.path});
}
util.inherits(Stack, Array);

//
//
//
Stack.prototype.siteID = function(site){
  if(site.stack){ return '(' + site.stack.path + ')'; }
  return site.name || site.displayName || this.indexOf(site) + ':anonymous';
};

//
//
//
Stack.prototype.onHandle = function(){

};

//
//
//
Stack.prototype.onHandleError = function(err){
  if(err){ throw err; }
};
