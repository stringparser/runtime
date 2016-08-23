'use strict';

var util = require('./util');

exports = module.exports = util.createClass(Array, {
  create: function Stack (sites, props) {
    if (!(this instanceof Stack)) {
      return new Stack(sites);
    }

    Stack.super_.apply(this, sites);
    util.merge(this, props);
  }
});
