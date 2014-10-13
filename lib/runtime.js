'use strict';

/*
 * Module dependencies
 */

var fs = require('fs');
var tty = require('tty');
var path = require('path');
var readline = require('readline');

var util = require('./utils');
var Command = require('./command');
var on = util.requiredir(__dirname, 'on');

var debug = util.debug(__filename);

exports = module.exports = {
      get : getRuntime,
   create : createRuntime,
  Runtime : Runtime
};

/*
 * doc holder
 */

var warehouse = { };
function getRuntime(name){
  var rt = warehouse[name];
  return rt ? rt : createRuntime(name);
}

/**
 *
 */

function createRuntime(name, config){
  name = util.type(name).string || '#root';
  var runtime  = warehouse[name] = new Runtime(name, config);
  return runtime;
}

/**
 *
 */
var pathCompletion = [ ];
function Runtime(name, config){

  if( !(this instanceof Runtime) ){
    return new Runtime(name, config);
  }

  config = util.type(config).plainObject || { };
  config.name = util.type(name).string || '#root';
  config.repl = util.type(config.repl).boolean ? config.repl : true;
  config.startup = util.type(config.startup).boolean ? config.startup : true;

  util.merge(this, new Command(config));

  var input, output;
  input = util.type(config.input).stream;
  output = util.type(config.output).stream;

  if( config.repl ){
    input = input || new tty.WriteStream();
    output = output || new tty.WriteStream();
    process.stdin.setRawMode(true);
    process.stdin.pipe(input);
    output.pipe(process.stdout);
  }
  // attach readline's instance methods
  readline.Interface.call(this,
    input, output, this.completer.bind(this) );

  var sink = null;
  if( config.repl ){
    on.keypress(this);
    this.setPrompt(' > '+this.config('name')+' ');
    sink = pathCompletion[0] || on.path('.', pathCompletion);
  }

  // wire things up
  on.line(this).wire(this).next(this);
}
util.inherits(Runtime, readline.Interface);

/**
 * lexer
 */

Runtime.prototype.lexer = function(line){
  var cmd = line.replace(/(\d+|=\S+)/g, '').split(/[ ]+/);
  debug('cmd', cmd);
  return cmd !== null ? cmd : [ ];
};

/**
 * parser
 */

Runtime.prototype.parser = function(line){
  line = util.type(line);
  if( !line.match(/string|array/) ){
    throw new util.Error(
      ' '+this.config('name')+'.parser: '+
      ' The default parser needs an array or an `string`.'
    );
  }
  return line.string
    ? line.string.split(/[ ]+/)
    : line.array.join(' ').split(/[ ]+/);
};

/**
 * consumer
 */

Runtime.prototype.consumer = function(argv, args, next){
  var cmd = this.get(argv);
  var scope = null;
  if( cmd.handle ){
    scope = this.config('scope');
    scope = scope ? scope : this;
    cmd.handle.call(scope, argv, args, next);
    debug('consumed', argv, args);
  }
};

/**
 * completer
 */

Runtime.prototype.completer = function(line){
  var hits = [];
  var lexed = this.lexer(line);
  var completion = completionHelper(this, lexed);
  if( line.match(/[ ]+/) ){
    completion = completion.concat(pathCompletion.slice() || []);
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
  var timer = this.config('timer') || { };
  var scope = config.scope ? require(config.scope) : this;

  if( timer[eventName] ){
    clearTimeout(timer[eventName]);
    delete timer[eventName];
  }

  debug('handle', handle);
  this.on(eventName, handle.bind(scope));

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

/**
 *
 */

Runtime.prototype.reload = function (pathName){

  // caller's path
  var site = util.caller.path(2);
  if( site[0] !== path.sep ){
    site = path.resolve( path.dirname(site), pathName);
  }
  delete require.cache[site];
  return this.require(site);
};

/**
 *
 */

function completionHelper(runtime, stems){

  var cmd = runtime.get(stems);
  var anchor = runtime.get(cmd._parent);
  var completion = [ ];

  (cmd.completion || [ ])
    .concat(anchor.completion || [ ]).forEach(function(elem){
      if(completion.indexOf(elem) < 0){
        completion.push(elem);
      }
  });

  return completion;
}
