'use strict';

var util = require('./util');

exports = module.exports = Stack;

/**
  Missing docs
 */
function Stack(sites, props){
  if(!(this instanceof Stack)){
    return new Stack(sites, props);
  }

  util.merge(this, util.clone(props, true));

  this.tree = function(){
    return util.reduce(sites, function(tree, site, index){
      var node = site.stack instanceof Stack && site.stack.tree() || {
        label: site.displayName || site.name || 'anonymous'
      };
      tree.nodes.push(node);
      tree.label += (index && ' ' + node.label) || node.label;
    }, {label: '', nodes: []});
  };
}
util.inherits(Stack, Array);

/**
 Missing docs
**/
Stack.prototype.push = function(/* arguments */){
  var result = Array.prototype.push.apply(this, arguments);
  if(!this.count || this.count < 0){ this.count = 0; }
  this.count += arguments.length;
  return result;
};

/**
 Missing docs
**/
exports.createClass = util.classFactory(Stack);
