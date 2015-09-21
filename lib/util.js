'use strict';

var __slice = Array.prototype.slice;

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
exports.slice = function slice(a, b, c){
  return __slice.call(a, b, c);
};

exports.mapPush = function mapPush(argv, args, pos){
  var len = args.length;
  var index = -1;

  while(++pos < len){
    argv[++index] = args[pos];
  }

  return argv;
};

exports.classFactory = function classFactory(SuperCtor){
  return function extendsConstructor(mixin){
    function Ctor(props){
      if(!(this instanceof Ctor)){
        return new Ctor(props);
      }
      SuperCtor.apply(this, arguments);
    }

    Ctor.create = function(props){
      return new Ctor(props);
    };
    Ctor.createClass = Ctor.extend = exports.classFactory(Ctor);

    exports.inherits(Ctor, SuperCtor);
    exports.merge(Ctor.prototype, exports.type(mixin).plainObject);

    return Ctor;
  };
};
