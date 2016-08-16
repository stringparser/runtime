'use strict';

exports = module.exports = {};

// dependencies
//
exports.once = require('once');
exports.type = require('utils-type');
exports.clone = require('lodash.clone');
exports.merge = require('lodash.merge');
exports.inherits = require('inherits');
exports.asyncDone = require('async-done');

// assorted util
//

exports.mapFrom = function (argv, args, pos) {
  var index = -1;
  var length = args.length;

  while (++pos < length) {
    argv[++index] = args[pos];
  }
};

exports.classFactory = function (SuperTor) {

  function createClass (mixin) {
    mixin = mixin || {};

    var Tor = exports.type(mixin.create).function || function Tor (props) {
      if (!(this instanceof Tor)) {
        return new Tor(props);
      }
      SuperTor.call(this, props);
    };

    delete mixin.create;
    exports.inherits(Tor, SuperTor);
    exports.merge(Tor.prototype, mixin);

    Tor.create = function (a, b) { return new Tor(a, b); };
    Tor.createClass = exports.classFactory(Tor);

    return Tor;
  }

  return createClass;
};
