'use strict';

exports = module.exports = {};

// dependencies
//
exports.type = require('utils-type');
exports.clone = require('lodash.clone');
exports.merge = require('lodash.merge');
exports.reduce = require('lodash.reduce');
exports.inherits = require('inherits');
exports.asyncDone = require('async-done');

// assorted
//

exports.map = function mapPush(argv, args, pos){
  var index = -1, length = args.length;
  while(++pos < length){
    argv[++index] = args[pos];
  }
};

exports.areFunctions = function(args){
  if(!args || !args.length){ return false; }
  var length = args.length, index = -1;
  while(++index < length){
    if(typeof args[index] !== 'function'){
      return false;
    }
  }
  return true;
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

    Tor.create = function create(props){ return new Tor(props); };
    Tor.createClass = exports.classFactory(Tor);

    return Tor;
  }
  return createClass;
};
