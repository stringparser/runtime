'use strict';

/*
 * Module dependencies
 */

var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

var host = require('./host');
var util = require('./utils');
var Barn = require('./command');

/*
 * doc holder
 */

var warehouse = { };
function getRuntime(name){
  if( warehouse[name] ){
    return warehouse[name];
  } else {
    return createRuntime(name);
  }
}
exports.get = getRuntime;
/**
 *
 */

function createRuntime(name, config){

  var self = new Runtime(name, config);

  function runtime(obj, value){
    return self.config(obj, value);
  }
  util.merge(runtime, self);

  return runtime;
}
exports.create = createRuntime;

function Runtime(name, config){

  if( !(this instanceof Runtime) ){
    return new Runtime(name, config);
  }

  config = util.type(config).plainObject || { };

  config.timer = config.timer || { };
  config.name = util.type(name).string || '#root';

  util.merge(this, new Barn(config));
  host.attach(this);
}
util.inherits(Runtime, EventEmitter);
exports.Runtime = Runtime;

/**
 * Runtime.prototype
 */

Runtime.prototype.waiting = function(eventName, handle){

  handle = util.type(handle).string;
  eventName = util.type(eventName).function;

  if( !eventName ){
    throw new util.Error(
      'runtime.waiting(eventName [, handle]): \n'+
      ' - `eventName` should be a `string`'+
      ' - `handle`, if given, is a `function`'
    );
  }

  var listeners = this.listeners(eventName);
  if( (!handle && !config[eventName]) || (!handle || !config[eventName]) ){
    return listeners;
  }

  var self = this;
  var config = this.config();
  var timer = this.config('timer');

  config[eventName] = util.type(config[eventName]).string || ' ';

  if( config[eventName].match(/once|[ ]/) ){
    this.once(eventName, function(){
       handle.call( config.scope ? require(config.scope) : self );
    });
  } else if( config[eventName].match(/persist/) ){
    this.on(eventName, function(){
       handle.call( config.scope ? require(config.scope) : self );
    });
  }

  if( timer[eventName] ){
    clearTimeout(timer[eventName]);
    delete timer[eventName];
    self.config('timer', timer);
  }

  timer[eventName] = setTimeout(function(){
    if( config[eventName] ){
      this.emit(eventName);
    }
  });

  return this;
};

/*
 * doc holder
 */

Runtime.prototype.startup = function(fn){

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

Runtime.prototype.shutdown = function(fn){

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

Runtime.prototype.require = function runtimeRequire(pathName){

  if(arguments.length > 1){
    pathName = [].slice.call(arguments);
  }

  var pathNameIs = util.type(pathName);

  var id, fileExports = { };
  var extension = /(\.(js|coffee)$)/i;

  if( pathNameIs.array ){

    pathName.forEach(function(fileName){
      if( util.type(fileName).string ){
        id = fileName.split(extension)[0];
        fileExports[id] = this.require(name);
      }
    }, this);

    return fileExports;

  }

  if( !pathNameIs.string ){
    throw new util.Error(
      ' runtime.require('+pathName+'):'+
      ' `'+pathName+'` should be a string or an array'
    );
  }

  if( pathName[0] !== '.'){
    return require(pathName);
  }

  // caller's path
  var site = path.resolve(
    path.dirname( util.caller.path(runtimeRequire)), pathName
  );

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
