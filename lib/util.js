'use strict';

exports = module.exports = {};

// dependencies
//
exports.type = require('utils-type');
exports.clone = require('lodash.clone');
exports.merge = require('lodash.merge');
exports.inherits = require('inherits');
exports.asyncDone = require('async-done');

// assorted util
//

exports.mapFrom = function(argv, args, pos){
  var index = -1;
  var length = args.length;

  while(++pos < length){
    var value = args[pos];
    if(value){ argv[++index] = args[pos]; }
  }
};

exports.classFactory = function(SuperTor){

  function createClass(mixin){
    mixin = mixin || {};
    var create = exports.type(mixin.create).function;
    delete mixin.create;

    function Tor(props){
      if(!(this instanceof Tor)){
        return new Tor(props);
      }

      if(create){
        create.call(this, props, SuperTor);
      } else {
        SuperTor.call(this, props);
      }
    }
    exports.merge(Tor, SuperTor);
    exports.inherits(Tor, SuperTor);
    exports.merge(Tor.prototype, mixin);

    Tor.create = function(props){ return new Tor(props); };
    Tor.createClass = exports.classFactory(Tor);

    return Tor;
  }

  return createClass;
};
