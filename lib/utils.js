'use strict';

/*
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var merge = require('utils-merge');

exports = module.exports = merge({ }, util);
exports.merge = merge;

exports.type = require('utils-type');
exports.args = require('minimist');
exports.Error = require('herro').Herror;
exports.callsite = require('callsite');

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

/**
 * doc holder
 */
exports.tildify = function(fileName){

  var file = path.resolve(fileName);
  return ('~' + path.sep +
    path.relative(process.env.HOME || '.', file)
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
