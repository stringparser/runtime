'use strict';

var util = require('util');

exports = module.exports = { };

exports.merge = function(target, source){
  if(target && source){
    for(var key in source){
      target[key] = source[key];
    }
  }
  return target;
};

// core utils copy
var copy = exports.merge({ }, {
  inspect : util.inspect,
  inherits : util.inherits
});
exports.merge(exports, copy);

exports.which = require('which');
exports.argv = require('minimist');
exports.type = require('utils-type');
exports.through = require('through2');
exports.debug = require('utils-debug');
exports.requirem = require('requirem');
exports.findup = require('findup-sync');
exports.userHome = require('user-home');
exports.Error = require('herro').Herror;
exports.camelcase = require('camelcase');
exports.prettyTime = require('pretty-hrtime');

exports.boil = function (obj, regex){
  var objIs = exports.type(obj);
  if( !objIs.match(/string|array/) ){
    return [ ];
  }
  return (
    objIs.string
      ? obj.trim().split(regex || /[ ]+/)
      : obj.filter(function(elem){
        return exports.type(elem).string;
      }).join(' ').trim().split(regex || /[ ]+/)
  );
};
/**
 *
 */

function getCompletion(runtime, line){
  var completion = [ ];
  var cmd = runtime.get(runtime.lexer(line));
  var anchor = runtime.get(cmd._parent);
  (cmd.completion || [ ])
    .concat(anchor.completion || [ ]).forEach(function(elem){
      if(completion.indexOf(elem) < 0){
        completion.push(elem);
      }
  });
  return completion;
}
exports.getCompletion = getCompletion;
