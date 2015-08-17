'use strict';

var _slice = Array.prototype.slice;

exports = module.exports = {};

// dependencies
//
exports.type = require('utils-type');
exports.merge = require('lodash.merge');
exports.inherits = require('inherits');
exports.asyncDone = require('async-done');

// assorted
//

exports.slice = function slice(args, index, top){
  return _slice.call(args, index, top);
};

exports.mapPush = function mapPush(argv, args, pos){
  if(!args.length){ return argv; }

  pos = (Number(pos) || 0) - 1;
  var top = argv.length;
  var len = args.length;

  var index = -1;
  while(++pos < len){
    if(++index < top){
      argv[index] = args[pos];
    } else {
      argv.push(args[pos]);
    }
  }

  return argv;
};

exports.isFunction = function(value){
  return value && typeof value === 'function';
};

exports.classFactory = function classFactory(SuperCtor){
  return function extendsConstructor(mixin){
    function Ctor(props){
      if(!(this instanceof Ctor)){
        return new Ctor(props);
      }
      SuperCtor.apply(this, arguments);
    }
    exports.inherits(Ctor, SuperCtor);
    exports.merge(Ctor.prototype, exports.type(mixin).plainObject);
    return Ctor;
  };
};
