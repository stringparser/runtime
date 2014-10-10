'use strict';

/*
 * Module dependencies
 */

var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

var util = require('./utils');
var Command = require('./command');
var readlineHost = require('./readlineHost');

var __ = [];
var __slice = __.slice;
var debug = util.debug(__filename);

module.exports = {
      get : getRuntime,
   create : createReadlineRuntime,
  Runtime : Runtime,
  Command : Command
};

/*
 * doc holder
 */

var warehouse = { };
function getRuntime(name){
  if( warehouse[name] ){
    return warehouse[name];
  } else {
    return createReadlineRuntime(name);
  }
}

/**
 *
 */

function createReadlineRuntime(name, config){
  var runtime = new Runtime(name, config);
  readlineHost(runtime);
  warehouse[name] = runtime;
  return runtime;
}

function Runtime(name, config){

  if( !(this instanceof Runtime) ){
    return new Runtime(name, config);
  }

  config = util.type(config).plainObject || { };
  config.name = util.type(name).string || '#root';
  config.startup = true;
  config.timer = { };
  util.merge(this, new Command(config));
}
util.inherits(Runtime, EventEmitter);

/**
 * Runtime.prototype
 */

Runtime.prototype.wire = function(/* arguments */){
  this.emit.apply(this, ['wire'].concat( __slice(arguments)) );
};

Runtime.prototype.waiting = function(eventName, handle){

  handle = util.type(handle).function;
  eventName = util.type(eventName).string;

  if( !eventName ){
    throw new util.Error(
      'runtime.waiting(eventName [, handle]): \n'+
      ' - `eventName` should be a `string`\n'+
      ' - `handle`, if given, is a `function` or `array`'
    );
  }

  if( !handle ){
    return this.listeners(eventName);
  }

  var config = this.config();
  var timer = this.config('timer');
  var scope = config.scope ? require(config.scope) : this;

  if( timer[eventName] ){
    clearTimeout(timer[eventName]);
    delete timer[eventName];
    this.config('timer', timer);
  }

  this.on(eventName, function(){
    handle.call(scope);
  });

  debug('handle', handle);

  var self = this;
  timer[eventName] = setTimeout(function(){
    if( config[eventName] ){
      self.emit(eventName);
    }
  });

  return this;
};

/**
 * Runtime.prototype
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

Runtime.prototype.require = function (pathName){

  if( pathName[0] === path.sep ){
    return require(pathName);
  }

  var id, fileExports = { };
  var extension = /(\.(js|coffee)$)/i;

  // caller's path
  var site = util.caller.path(Runtime.require);
  if( pathName[0] !== path.sep ){
    site = path.resolve( path.dirname(site), pathName );
  }

  var dirls, stat = fs.statSync(site);

  debug('pathName ', pathName);
  debug('site ', site);

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


Runtime.prototype.reload = function (pathName){

  // caller's path
  var site = util.caller.path(2);
  if( site[0] !== path.sep ){
    site = path.resolve( path.dirname(site), pathName);
  }
  delete require.cache[site];
  return this.require(site);
};
