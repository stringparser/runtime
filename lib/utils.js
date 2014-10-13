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

  if( !obj ){ return [ ]; }

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

exports.requiredir = function(parent, dirname){
  var dir = path.join( parent, path.basename(dirname));
  var fileList = fs.readdirSync(dir);

  var fileExports = { };
  fileList.forEach(function(fileName){
    var name = path.basename(fileName, path.extname(fileName));
    fileExports[name] =  require(path.join(dir, fileName));
  });
  return fileExports;
};
