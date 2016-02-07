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

    function RuntimeClass(props){
      if(!(this instanceof RuntimeClass)){
        return new RuntimeClass(props);
      }

      if(create){
        create.call(this, props, SuperTor);
      } else {
        SuperTor.call(this, props);
      }
    }

    exports.inherits(RuntimeClass, SuperTor);
    exports.merge(RuntimeClass.prototype, mixin);

    RuntimeClass.create = function(props){ return new RuntimeClass(props); };
    RuntimeClass.createClass = exports.classFactory(RuntimeClass);

    return RuntimeClass;
  }

  return createClass;
};
