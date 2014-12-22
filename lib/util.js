'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var utils = { };

exports = module.exports = utils;

utils.type = require('utils-type');
utils.through = require('through2');
utils.debug = require('utils-debug');
utils.requirem = require('requirem');
utils.clone = require('lodash.clone');
utils.prettyTime = require('pretty-hrtime');

utils.merge = function(target, source){
  if(!source){ target = source; target = { }; }
  if(target && source){
    for(var key in source){
      target[key] = source[key];
    }
  }
  return target;
};

// core utils copy
var copy = utils.merge({ }, {
  inspect : util.inspect,
  inherits : util.inherits
});
utils.merge(exports, copy);

utils.args = function (Args, index){
  index = index || 0;
  var len = Args.length;
  var args = new Array(len); args.length = 0;
  while(index < len){ args[args.length++] = Args[index++]; }
  return args;
};

/**
 * path completion
 */

utils.pathlete = pathlete;
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

utils.getCompletion = getCompletion;
function getCompletion(runtime, line){
  var completion = [ ];
  var cmd = runtime.get(line);
  var anchor = runtime.get(cmd._parent);
  (cmd.completion || [ ])
    .concat(anchor.completion || [ ]).forEach(function(elem){
      if(completion.indexOf(elem) < 0){
        completion.push(elem);
      }
  });
  return completion;
}

var pathlet = null;
utils.completer = completer;
function completer(runtime, line, callback){
  pathlet = pathlet || [ ];

  var hits = [ ];
  var match = line.match(/[ ]+\S+$|[ ]+$/);
  var completion = util.getCompletion(runtime, line);

  if( match ){
    util.pathlete(match[0], pathlet);
    line = line.substring(match.index, line.length).trim();
  }

  hits = completion.concat(pathlet).filter(function(elem){
    return elem.indexOf(line) === 0;
  });
  callback(null, [ hits.length ? hits : completion, line ]);
};
