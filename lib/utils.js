'use strict';

/*
 * Module dependencies
 */
var util = require('util');
var path = require('path');

exports = module.exports = { };

exports.type = require('utils-type');
exports.args = require('minimist');
exports.Error = require('herro').Herror;
exports.callsite = require('callsite');
exports.merge = function(a, b){
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
};

var copy = exports.merge({ }, util);
           exports.merge(exports, copy);

/**
 * doc holder
 */
exports.completion = function(runtime, stems){

  var debug = require('debug')('util:completion');
  var cmd = runtime.get(stems);
  var anchor = runtime.get(cmd._parent);
  var completion;

  if( cmd._name !== anchor._name ){
    completion = (cmd.completion || [ ]).concat( anchor.completion || []);
  } else {
    completion = cmd.completion || [ ];
  }

  completion = completion.sort(function(a,b){
    return (a.length - b.length);
  }).join(' ');

  var flags = completion.match(/[-]\S+/g) || [];
  var _ = completion.match(/(^|[ ]+)(\w+(.\w+)+)/g);
      _ = _ ? _.join('').trim().split(/[ ]+/) : [ ];

  debug('flags', flags);
  debug('    _', _);

  return _.concat(flags);
};

exports.quotify = function(str, colorFn){

  if( exports.type(str).string ){
    return str.replace(/(`|'|")(\S+)(`|'|")/g,
      function($0,$1,$2,$3){
        return $1 + colorFn.cyan($2) + $3;
      }
    );
  } else {
    return str;
  }
};

/**
 * sindresorhus home + tildify
 */
exports.tildify = function(base, fileName){

  var file;

  if(!fileName){
    fileName = base;
    file = path.resolve(fileName);
  } else {
    file = path.resolve(base, fileName);
  }

  var home = process.platform === 'win32' ? (
        process.env.USERPROFILE ||
        process.env.HOMEDRIVE + process.env.HOMEPATH
      ) : process.env.HOME;

  return (
    path.resolve('~',
      path.relative(home, file)
    )
  );
};

/**
 * doc holder
 */
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
