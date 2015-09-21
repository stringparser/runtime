'use strict';

var util = require('./util');

exports = module.exports = Stack;

/**
  Missing docs
 */
function Stack(funcs, props){
  if(!(this instanceof Stack)){
    return new Stack(funcs);
  }

  this.tree = function(){
    var tree = util.reduce(funcs, function(prev, site, index){
      var node = site.stack instanceof Stack && site.stack.tree() || {
        label: site.displayName || site.name || index + ':anonymous'
      };
      prev.nodes.push(node);
      prev.label += (index && ' ' + node.label) || node.label;
      return prev;
    }, {label: '', nodes: []});

    tree.label = (
      this.wait ? 'series' : 'parallel'
    ) + ':(' + tree.label + ')';
    return tree;
  };

  util.merge(this, util.clone(util.type(props).plainObject, true));
}

/**
 Missing docs
**/
exports.createClass = exports.extend = util.classFactory(Stack);
