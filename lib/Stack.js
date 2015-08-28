'use strict';

var util = require('./util');

exports = module.exports = Stack;

/**
  Missing docs
 */
function Stack(funcs, pushSites){
  if(!(this instanceof Stack)){
    return new Stack(funcs);
  }

  this.tree = function(){
    return util.reduce(funcs, function(prev, site, index){
      var node = {label: util.siteID(site, index)};
      if(site.stack instanceof Stack){
        node.nodes = site.stack.tree().nodes;
      }
      if(prev.label){ prev.label += ' ' + node.label; } else {
        prev.label = node.label;
      }
      prev.nodes.push(node);
      return prev;
    }, {label: '', nodes: []});
  };

  if(!pushSites){ return this; }
  this.push.apply(this, funcs);
}
util.inherits(Stack, Array);

/**
 Missing docs
**/
exports.createClass = exports.extend = util.classFactory(Stack);
