'use strict';

var __slice = Array.prototype.slice;

exports = module.exports = {};

// dependencies
//
exports.type = require('utils-type');
exports.merge = require('lodash.merge');
exports.reduce = require('lodash.reduce');
exports.inherits = require('inherits');
exports.asyncDone = require('async-done');

// assorted
//
exports.slice = function slice(a, b, c){
  return __slice.call(a, b, c);
};

exports.siteID = function siteID(site, index){
  if(site.stack){ return '(' + site.stack.tree().label + ')'; }
  return site.name || site.displayName || index + ':anonymous';
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
