'use strict';

var fs = require('fs');
var path = require('path');
var utils = require('util');
var util = { };

exports = module.exports = utils;

util.merge = function(target, source){
  if(target && source){
    for(var key in source){
      target[key] = source[key];
    }
  }
  return target;
};

// core utils copy
var copy = exports.merge({ }, {
  inspect : utils.inspect,
  inherits : utils.inherits
});
util.merge(exports, copy);

util.type = require('utils-type');
util.through = require('through2');
util.debug = require('utils-debug');
util.requirem = require('requirem');
util.clone = require('lodash.clone');
util.prettyTime = require('pretty-hrtime');

util.args = function (args_, opt){
  var len, index, args;

  opt = opt || { };
  len = args_.length;
  opt.index = opt.index > 0 ? opt.index : 0;
  args = new Array((len = args_.length - opt.index));

  for(index = opt.index; index < len; index++){
    args[opt.index - index] = args_[opt.index + index];
  }

  if(opt.async){
    if(!(args[0] instanceof Error)){ args.unshift(null); }
  }

  opt = len = index = null;
  return args || [ ];
};

/**
 * path completion
 */

util.pathlete = pathlete;
function pathlete(partial, complete){
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

util.getCompletion = getCompletion;
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
