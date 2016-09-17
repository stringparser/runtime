'use strict';

var util = require('./util');
var emptyFn = function () {};

function Stack (sites, props) {
  if (!(this instanceof Stack)) {
    return new Stack(sites);
  }

  this.push.apply(this, sites);
  if (props) { util.merge(this, props); }
}

exports = module.exports = util.createClass(Array, {
  create: Stack,
  reduceStack: function (stack, site) {
    if (typeof site === 'function') {
      stack.push({ fn: site });
    } else if (site && typeof site.fn === 'function') {
      stack.push(site);
    }
    return stack;
  },
  onHandleEnd: emptyFn,
  onHandleStart: emptyFn,
  onHandleError: function (error) { throw error }
});
