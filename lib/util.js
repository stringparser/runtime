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
  var index = -1, length = args.length;
  while(++index < length){
    if(typeof args[index] !== 'function'){
      return false;
    }
  }
  return true;
};

exports.classFactory = function classFactory(SuperTor){
  function createClass(mixin){
    function Tor(props){
      if(!(this instanceof Tor)){ return new Tor(props); }
      SuperTor.apply(this, arguments);
    }
    exports.inherits(Tor, SuperTor);

    Tor.create = function(props){ return new Tor(props); };
    Tor.createClass = exports.classFactory(Tor);

    exports.merge(Tor.prototype, exports.type(mixin).plainObject);

    return Tor;
  }
  return createClass;
};
