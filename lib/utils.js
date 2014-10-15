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

// type checking
exports.type = require('utils-type');
exports.argv = require('minimist');
exports.debug = require('utils-debug');
exports.Error = require('herro').Herror;
exports.which = require('which');
exports.camelcase = require('camelcase');
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

function requirem(origin, pathName, opts){
  opts = exports.type(opts).plainObject || { };
  pathName = exports.type(pathName).string || exports.type(origin).string;
  if( !pathName ){
    throw new Error('requirem pathName should be a `string`');
  }
  var dirname = exports.type(origin).string;
  origin = exports.type(origin).function || requirem;
  dirname = dirname || exports.caller.path(path.dirname(origin));

  // resolve paths first
  var resolved = dirname;
  if( path.basename(dirname) !== path.basename(pathName) ){
    resolved = path.resolve(dirname, path.basename(pathName));
  }

  // module?
  var error = null;
  try { resolved = require.resolve(resolved); } catch(err) { error = err; }
  if( !error ){
    if( opts.reload ){ delete require.cache[resolved]; }
    return require(resolved);
  }

  // plain directories left
  var dirls = null;
  try {  dirls = fs.readdirSync(resolved); } catch(err){ error = err; }
  if( error && error.code === 'ENOENT' ){ throw error; }

  // the path resolved is a directory and exists
  dirname = resolved;
  var name = null;
  var extension = /(\.(js)$)/i;
  var fileExports = { };

  dirls.forEach(requireFiles);
  function requireFiles(fileName){
    if( !extension.test(fileName) ){ return ; }
    name = path.basename(fileName, path.extname(fileName));
    resolved = path.resolve(dirname, fileName);
    if( opts.reload){ delete require.cache[resolved]; }
    fileExports[ exports.camelcase(name) ] = require(resolved);
  }
  return fileExports;
}
exports.requirem = requirem;
