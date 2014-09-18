'use strict';

/*
 * Module dependencies
 */

var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

var host = require('./host');
var util = require('./utils');
var Command = require('./command');

/*
 * doc holder
 */

exports = module.exports = {
  create : createRuntime,
     get : getRuntime
};

var warehouse = { };

function getRuntime(name){

  return warehouse[name];
}

/**
 *
 */

function createRuntime(name){

  name = util.type(name).string || '#root';

  var config = {
       name : name,
      timer : { },
    startup : true
  };

  var runtime = function(config){
    return runtime.config(config);
  };
  util.merge(runtime, proto);
  util.merge(runtime, new Command(config) );
  util.merge(runtime, EventEmitter.prototype);

  runtime = host.attach(runtime);

  warehouse[name] = runtime;

  return runtime;
}

/*
 * runtime prototype
 */

var proto = { };
proto.waiting = function(eventName, handle){

  var eventNameIs = util.type(eventName),
      handleIs = util.type(handle);

  if( !eventNameIs.string ){
    throw new util.Error(
      'runtime.waiting(eventName [, handle]): \n'+
      ' - `eventName` should be a `string`'+
      ' - `handle`, if given, is a `function`'
    );
  }

  var self = this;
  var config = this.config();
  var timer = this.config('timer');

  if( handleIs.undefined ){
    return this.listeners(eventName);
  } else if( handleIs.function ){

    this.on(eventName, function(){
      handle.call( config.scope ? require(config.scope) : self );
    });

    if(timer[eventName]){
      clearTimeout(timer[eventName]);
    }

    timer[eventName] = setTimeout(function(){

      if(config[eventName]){
        this.emit(eventName);
      }

      delete timer[eventName];
      self.config('timer', timer);
    });

  }

  return this;
};

/*
 * doc holder
 */

proto.startup = function(fn){

  if( fn === void 0 ){
    this.emit('startup');
  } else {
    this.waiting('startup', fn);
  }

  return this;
};

/*
 * doc holder
 */

proto.shutdown = function(fn){

  if( fn === void 0 ){
    this.emit('shutdown');
  } else {
    this.waiting('shutdown', fn);
  }

  return this;
};

/*
 * doc holder
 */

proto.require = function(pathName){

  var pathNameIs = util.type(pathName);

  if(arguments.length > 1){
    pathName = [].slice.call(arguments);
    pathNameIs = { array : true, object : true };
  }

  if( !pathNameIs.string && !pathNameIs.array ){
    throw new util.Error('runtime.require(pathName): \n'+
      ' - `pathName` should be a `string` or an array'+
      '\n -- \n'+
      ' Note: it will only match `js` and `coffee` files.'
    );
  }

  var id, fileExports = { };
  var extension = /(\.(js|coffee)$)/i;

  if( pathNameIs.array ){

    pathName.forEach(function(name){
      if( util.type(name).string ){
        id = name.split(extension)[0];
        fileExports[id] = this.require(name);
      }
    }, this);

    return fileExports;

  } else if( pathName[0] !== '.'){
    return require(pathName);
  }

  // caller's path
  var site = util.callsite()[1].getFileName();
      site = path.resolve(path.dirname(site), pathName);

  var dirls, stat = fs.statSync(site);
  if( stat.isFile() && extension.test(site) ){
    return require(site);
  } else if( stat.isDirectory() ){
    dirls = fs.readdirSync(site);
  } else {
    throw new util.Error(
      ' runtime.require('+pathName+'):'+
      ' `'+pathName+'` is neither a directory nor a .js/.coffee file'
    );
  }

  dirls.forEach(function(fileName){

    if( extension.test(fileName) ){
      id = fileName.split(extension)[0];

      fileExports[id] = require(
        path.resolve(site, fileName)
      );
    }
  });


  return fileExports;
};
