'use strict';

var util = require('util');

exports = module.exports = { };

exports.merge = require('lodash.merge');

var copy = exports.merge({ }, {
  inspect : util.inspect,
  inherits : util.inherits
});

exports.merge(exports, copy);

// type checking
exports.type = require('utils-type');
// cli argument parsing
exports.argv = require('minimist');

exports.debug = require('utils-debug');
exports.Error = require('herro').Herror;
exports.which = require('which');
exports.caller = {
  path : require('callers-path')
};

exports.boil = function (obj, regex){

  if( !obj ){
    return [ ];
  }

  var objIs = exports.type(obj);

  if( objIs.string ){
    return obj.trim().split(regex || /[ ]+/);
  }

  if( objIs.array ){
    return obj.filter(function(elem){
      return exports.type(elem).string;
    });
  }

  return [ ];
};
