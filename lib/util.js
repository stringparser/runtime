'use strict';

var reduce = require('lodash.reduce');

exports = module.exports = {};

// dependencies
//
exports.type = require('utils-type');
exports.clone = require('lodash.clone');
exports.merge = require('lodash.merge');
exports.inherits = require('inherits');
exports.asyncDone = require('async-done');

// assorted
//
exports.map = function(argv, args, pos){
  var index = -1, length = args.length;
  while(++pos < length){
    argv[++index] = args[pos];
  }
};

// lodash may not bind the iterator function...
//
exports.reduce = function(collection, handle, acc, self){
  acc = acc || {};
  self = self || acc;
  function iterator(/* arguments */){
    handle.apply(self, arguments);
    return acc;
  }
  return reduce(collection, iterator, acc);
};

exports.classFactory = function(SuperTor){
  function createClass(mixin){
    mixin = exports.type(mixin).plainObject || {};
    if(!exports.type(mixin.create).function){
      delete mixin.create;
    }

    function Tor(a, b){
      if(!(this instanceof Tor)){
        return new Tor(a, b);
      } else if(mixin.create && this.create === mixin.create){
        this.create.call(this, SuperTor, a, b);
      } else {
        SuperTor.apply(this, arguments);
      }
    }
    exports.inherits(Tor, SuperTor);
    exports.merge(Tor.prototype, mixin);

    Tor.create = function create(a, b){ return new Tor(a, b); };
    Tor.createClass = exports.classFactory(Tor);

    return Tor;
  }
  return createClass;
};

exports.popLastObject = function(calls){
  return exports.type(calls[calls.length-1]).plainObject && calls.pop();
};
