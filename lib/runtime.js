
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


proto.wire = function(/* arguments */){

  util.assert( util.type(arguments[0]).string );

  var args = [].slice.call(arguments);

  args.unshift('wire');
  this.emit.apply(this, args);

  return this;
};

/*
 * doc holder
 */

proto.waiting = function(eventName, fn){

  util.assert( util.type(arguments[0]).string );

  var self = this;
  var config = this.config();
  var timer = this.config('timer');

  if( eventName )
    return this.listeners(eventName);
  else if( util.type(fn).function ){

    this.on(eventName, function(){
      fn.call( config.scope ? require(config.scope) : self );
    });

    if(timer[eventName])
      clearTimeout(timer[eventName]);

    timer[eventName] = setTimeout(function(){

      if(config[eventName])
        this.emit(eventName);

      delete timer[eventName];
      self.config('timer', timer);
    });

  } else
    util.assert( util.type(arguments[1]).function );

  return this;
};

/*
 * doc holder
 */

proto.startup = function(fn){

  if( fn === void 0 )
    this.emit('startup');
  else
    this.waiting('startup', fn);

  return this;
};

/*
 * doc holder
 */

proto.shutdown = function(fn){

  if( fn === void 0 )
    this.emit('shutdown');
  else
    this.waiting('shutdown', fn);

  return this;
};

/*
 * doc holder
 */

proto.require = function(str){

  util.assert( util.type(arguments[0]).string );

  // get and resolve the util.callsite's path
  var site = path.resolve(
    path.dirname( util.callsite()[1].getFileName() ), str);

  var stat, fileList;
  try {

    stat = fs.statSync(site);
    if( stat.isFile() )
      return require(site);
    else if( stat.isDirectory() )
      fileList = fs.readdirSync(site);
    else {
      throw new util.Error(
        'runtime.require('+str+'): '+
        'is not a file or directory'
      );
    }

  } catch(err){

    throw util.Error.call(err,
      'runtime.require(`'+str+'`): ' +
      'file/folder `'+site+'` doesn\'t exists.'
    );
  }

  var fileExports = { };
  fileList.forEach(function(fileName){

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
