'use strict';

var util = require('./util');

function Stack (sites, props) {
  if (!(this instanceof Stack)) {
    return new Stack(sites);
  }

  util.merge(this, props);
  this.push.apply(this, sites);
}

exports = module.exports = util.createClass(Array, {
  create: Stack
});
