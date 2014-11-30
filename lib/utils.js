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

exports.whech = require('whech');
exports.argv = require('minimist');
exports.type = require('utils-type');
exports.through = require('through2');
exports.debug = require('utils-debug');
exports.requirem = require('requirem');
exports.Error = require('herro').Herror;
exports.camelcase = require('camelcase');
exports.prettyTime = require('pretty-hrtime');

exports.boil = function (obj, regex){
  obj = exports.type(obj);
  if( !obj.string && !obj.array ){  return [ ];  }
  obj = obj.string || obj.array.join(' ');
  return obj.trim().split(regex || /[ ]+/);
};


exports.args = function (args_, opt){
  var len, index, args;

  opt = opt || { };
  opt.index = opt.index || 0;
  len = args_.length - opt.index;
  args = new Array(len);

  for(index = opt.index; index < len; index++){
    args[opt.index-index] = args_[opt.index + index];
  }

  // enforce callback pattern (err, arg1, arg2, etc.)
  if(opt.async === void 0){ opt.async = true; }
  if(opt.async && !(args[opt.index] instanceof Error)){
    args.unshift(null);
  }

  opt = len = index = null;
  return args || [ ];
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
