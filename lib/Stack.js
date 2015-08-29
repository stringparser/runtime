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
    var top = funcs.length - 1;
    return util.reduce(funcs, function(tree, site, index){
      var node = site.stack instanceof Stack && site.stack.tree() || {
        label: site.displayName || site.name || index + ':anonymous'
      };

      tree.nodes.push(node);
      tree.label += (index && ' ' + node.label) || node.label;
      if(index < top){ return tree; }
      tree.label = '(' + tree.label + ')';

      return tree;
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
