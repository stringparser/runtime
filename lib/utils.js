'use strict';

var util = require('util');
var debug = require('debug')('runtime:utils');

exports = module.exports = { };

var merge = exports.merge = require('utils-merge');

var copy = merge({ }, {
  inspect : util.inspect,
  inherits : util.inherits
});

merge(exports, copy);
exports.type = require('utils-type');
exports.argv = require('minimist');
exports.Error = require('herro').Herror;
exports.which = require('which');
exports.callsite = require('callsite');

exports.completion = function(runtime, stems){

  var cmd = runtime.get(stems);
  var anchor = runtime.get(cmd._parent);
  var completion = [ ];

  (cmd.completion || [ ])
    .concat(anchor.completion || [ ]).forEach(function(elem){
      if(completion.indexOf(elem) < 0){
        completion.push(elem);
      }
  });

  debug('completion:', completion);

  return completion;
};

exports.boil = function (obj, regex){

  if( !obj ){
    return [ ];
  }

  var objIs = exports.type(obj);

  if( objIs.string ){
    return obj.trim().split(regex || /[ ]+/);
  } else if( objIs.array ){
    return obj.filter(function(elem){
      return exports.type(elem).string;
    });
  } else {
    return [ ];
  }
};
