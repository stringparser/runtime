'use strict';

var fs = require('fs');
var path = require('path');
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

  opt = len = index = null;
  return args || [ ];
};

/**
 * path completion
 */

exports.pathlete = function (partial, complete){
  var cwd = process.cwd();
  if( !complete.length ){
    complete = fs.readdirSync(cwd).filter(function(pathname){
      return !(/^\.|node_modules/i).test(pathname);
    });
    complete.push('..');
  }
  //
  // return early for
  //  - no matches
  //  - something with extension
  //  - path does not match initial basedirs
  //
  partial = (partial || '').trim();
  var index;
  var basedir = partial.split(path.sep)[0];
  var resolved = path.resolve(cwd, partial);
  if( path.extname(partial) ){  return complete;  }
  if( complete.indexOf(partial) > -1 ){ return complete; }
  if( (index = complete.indexOf(basedir)) < 0 ){  return complete;  }

  try {
    var lstat = fs.lstatSync(resolved);
    if( !lstat.isDirectory() ){  return complete;  }
  } catch(err){ return complete; }
  // or didn't exist or wasn't a directory
  // not useful to throw for tab completion

  var notEmpty = false;
  fs.readdirSync(resolved)
    .forEach(function(pathname){
      if( complete.indexOf(pathname) > -1 ){  return ;  }
      complete.push(path.join(partial, pathname));
      notEmpty = true;
    });
  complete[index] += path.sep;
  return complete;
}

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
