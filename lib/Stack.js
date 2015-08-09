'use strict';

var util = require('./util');

exports = module.exports = Stack;

function Stack(sites, attach){
  if(!(this instanceof Stack)){ return new Stack(sites); }
  if(!arguments.length){ return this; }

  var top = sites.length;
  var context = sites[--top];
  if(util.type(context).plainObject){
    util.merge(this, context); --top;
  }

  if(!attach){ return this; }
  for(var index = top; index > -1; --index){
    if(typeof sites[index] === 'function'){
      this.push(sites[index]);
    }
  }
}
util.inherits(Stack, Array);
