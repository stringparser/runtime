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

  var self = new Runtime(name, config);

  function runtime(obj, value){
    return self.config(obj, value);
  }
  util.merge(runtime, self);
  readlineHost(runtime);

  return runtime;
}

function Runtime(name, config){

  if( !(this instanceof Runtime) ){
    return new Runtime(name, config);
  }

  config = util.type(config).plainObject || { };

  config.timer = config.timer || { };
  config.name = util.type(name).string || '#root';

  util.merge(this, new Command(config));
  util.merge(this, EventEmitter.prototype);
}


/**
 * Runtime.prototype
 */

Runtime.prototype.lexer = function (line){
  var cmd = line.replace(/(\d+|=\S+)/g, '').split(/[ ]+/);
  debug('cmd', cmd);
  return cmd !== null ? cmd : [ ];
};

/**
 * Runtime.prototype
 */

Runtime.prototype.parser = function (line){
  line = util.type(line);

  if( line.array ){
    return util.argv(line.array);
  }

  if( line.string ){
    return util.argv(line.string.split(/[ ]+/));
  }

  throw new util.Error(
    ' '+this.config('name')+'.parser: '+
    ' The default parser needs an array or an `string`.'
  );
};

/**
 * Runtime.prototype
 */

Runtime.prototype.consumer = function (argv, args, cmd){

  cmd = cmd || this.get(argv);

  var scope = this.config('scope');
  var anchor = this.get(cmd._parent);

  debug('   cmd', cmd);
  debug('  argv', argv);
  debug(' scope', scope);
  debug('anchor', anchor);

  if( cmd.handle ){
    cmd.handle.call(scope ? require(scope) : this, argv, args);
    debug('consumed arguments', argv);
  }
};

/**
 * Runtime.prototype
 */

Runtime.prototype.completer = function (line){

  var hits = [];
  var lexed = this.lexer(line);
  var completion = this.completion(lexed);

  if( line.match(/[ ]+/) ){

    completion = completion.concat(
      this.config('completion').slice() || []
    );

    var spaceEnd = line.match(/[ ]+\S+$/);
    if( spaceEnd ){
      line = line.substring(spaceEnd.index, line.length).trim();
    }
  }

  debug('line = ', line);
  debug('lexed = ', lexed);
  debug('completion =', completion);

  lexed.forEach(function(elem){
    var index = completion.indexOf(elem);
    if( index > -1 ){
      completion.splice(index, 1);
    }
  });

  hits = completion.filter(function(elem){
    return elem.indexOf(line) === 0;
  });

  debug('hits', hits);

  return [ hits[0] ? hits : completion, line ];
};

/**
 * Runtime.prototype
 */

Runtime.prototype.completion = function(stems){

  var cmd = this.get(stems);
  var anchor = this.get(cmd._parent);
  var completion = [ ];

  (cmd.completion || [ ])
    .concat(anchor.completion || [ ]).forEach(function(elem){
      if(completion.indexOf(elem) < 0){
        completion.push(elem);
      }
  });

  return completion;
};

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

  if( !handle ){
    return this.listeners(eventName);
  }

  var self = this;
  var config = this.config();
  var timer = this.config('timer');

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

Runtime.prototype.require = function RuntimeRequire(pathName){

  var id, fileExports = { };
  var extension = /(\.(js|coffee)$)/i;

  if( pathName[0] !== '.' ){
    return require(pathName);
  }

  // caller's path
  var site = util.caller.path(RuntimeRequire);
  if( site[0] !== path.sep ){
    site = path.resolve( path.dirname(site), pathName );
  }

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


Runtime.prototype.reload = function RuntimeReload(pathName){

  // caller's path
  var site = util.caller.path(RuntimeReload);
  if( site[0] !== path.sep ){
    site = path.resolve( path.dirname(site), pathName);
  }
  delete require.cache[site];
  return this.require(site, { reload : true });
};
