'use strict';

var util = require('./util');

exports = module.exports = Stack;

/**
 * Stack
 * @constructor
 * @param sites {Arguments|Array}
 * @param pushSites {Boolean}
 * @returns {Stack} instance
 */

function Stack(sites){
  if(!(this instanceof Stack)){ return new Stack(sites); }
  if(!arguments.length){ return this; }

  var top = sites.length;
  var context = sites[--top];
  if(util.type(context).plainObject){
    util.merge(this, context); --top;
  }

  for(var index = top; index > -1; --index){
    if(typeof sites[index] === 'function'){
      this.push(sites[index]);
    }
  }
}
util.inherits(Stack, Array);
