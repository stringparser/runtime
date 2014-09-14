'use strict';

/*
 * Module dependencies
 */

var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

var proto = { };
var host = require('./host');
var util = require('./utils');
var Command = require('./command');

/*
 * doc holder
 */

exports = module.exports = { };
exports.create = createRuntime;


/**
 *
 */

function createRuntime(name){

  var config = {
       name : util.type(name).string || '#root',
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
  return runtime;
}

/*
 * doc holder
 */

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

  if( !pathNameIs.string && !pathNameIs.array ){
    throw new util.Error('runtime.require(pathName): \n'+
      ' - `pathName` should be a `string` or an array'+
      '\n -- \n'+
      ' Note: it will only match `js` and `coffee` files.'
    );
  }

  if( pathNameIs.array ){
    pathName.forEach(function(elem){
      this.require(elem);
    }, this);
  }

  // caller's path
  var site = util.callsite()[1].getFileName();
      site = path.resolve(path.dirname(site), pathName);

  var stat, dirls;
  try {

    stat = fs.statSync(site);
    if( stat.isFile() ){
      return require(site);
    } else if( stat.isDirectory() ){
      dirls = fs.readdirSync(site);
    } else {
      throw new util.Error(
        ' runtime.require('+pathName+'):'+
        ' is not a file or directory'
      );
    }

  } catch(err){

    throw util.Error.call(err, err.message, function(err){
      err.message = err.message +
        '\n runtime.require(`'+pathName+'`):' +
        ' file/folder `'+site+'` doesn\'t exists.';
    });
  }

  var fileExports = { };
  dirls.forEach(function(fileName){

    var extension = path.extname(fileName);
    var test = /(\.(js|coffee)$)/i.test(extension);

    var id;
    if(test){

      id = path.basename(
        fileName, path.extname(fileName)
      );
      fileExports[id] = require(
        path.resolve(site, fileName)
      );
    }
  });


  return fileExports;
};
