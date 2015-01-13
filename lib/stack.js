'use strict';

var util = require('./util');

module.exports = exports = Stack;

function Stack(init){
  if(!(this instanceof Stack)){
    return new Stack(init);
  }
  util.merge(this, Object.create(init));
}
