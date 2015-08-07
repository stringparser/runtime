'use strict';

var util = require('./util');

exports = module.exports = Stack;

function Stack(sites){
  if(!(this instanceof Stack)){ return new Stack(sites); }
  if(!arguments.length || !sites || !sites.length){ return this; }

  var length = sites.length;
  var context = sites[length - 1];
  if(util.type(context).plainObject){
    util.merge(this, context); --length;
  }

  for(var index = 0; index < length; ++index){
    var site = sites[index];
    if(typeof site !== 'function'){ continue; }

    this.push(site);
    this.queue = this.queue
      ? this.queue + ' ' + this.siteID(site)
      : this.siteID(site);
  }
}
util.inherits(Stack, Array);

//
//
//
Stack.prototype.siteID = function(site){
  if(site.stack){ return '(' + site.stack.queue + ')'; }
  return site.name || site.displayName || this.indexOf(site) + ':anonymous';
};
