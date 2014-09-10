
/*
 * Module dependencies
 */

var fs = require('fs');
var path = require('path');
var Herror = require('herro').Herror;

var util = require('./utils');
var host = require('./host');
var Command = require('./command');

var merge = util.merge;
var assert = util.assert;
var caller = util.callsite;
var terminal = host.getInterface();

/*
 * doc holder
 */

exports = module.exports = { };

/*
 * function `create`
 *
 * @param {String} name
 * @return {Runtime} instance
 */

function create(name){

  var runtime = function(config){
    return runtime.config(config);
  };

  return merge(
    runtime, new Runtime(name)
  );
}

exports.create = create;

/*
 * `Runtime` constructor
 *
 * @param `string` runtimeName
 *
 * @return runtime instance
 */

function Runtime(runtimeName){

  if( !(this instanceof Runtime) ){
    return new Runtime(runtimeName);
  }

  /*
   * Closure variables
   */
  var name = util.isString(runtimeName) ? runtimeName : '#root';
  var config = {
      timer : { },
     nested : true,
    startup : true
  };

  Object.defineProperty(config, 'name', {
           value : name,
        writable : false,
      enumerable : false,
    configurable : false
  });

  Object.defineProperty(config, 'scope', {
        enumerable : false,
      configurable : true,
     set : function(scopeValue){
       assert(util.isString(scopeValue));
       this.scope = scopeValue;
     }
  });

  merge(this, new Command(config));
  merge(this, host.getDefaults());
  //  ^ -----------------------------
  //  - lexer
  //  - parser
  //  - consumer
  //  - completer

  // hook the instance to `readline`
  host.setRuntime(this);

  this.setPrompt(' > '+name+' ');

  return this;
}

/*
 * doc holder
 */

Runtime.prototype.wire = function(command){

  assert( util.isString(arguments[0]) );

  terminal.emit('line', command);

  return this;
};

/*
 * doc holder
 */

Runtime.prototype.waiting = function(eventName, fn){

  assert( util.isString(arguments[0]) );

  var self = this;
  var len = arguments.length;
  var config = this.config();
  var scope = config.scope;
  var timer = this.config('timer');

  if( len === 1 ){
    return terminal.listeners(eventName);
  } else if( len === 2 ){

    assert( util.isFunction(arguments[1]) );

    terminal.on(eventName, function(){
      fn.call( scope ? require(scope) : self );
    });

    if(timer[eventName])
      clearTimeout(timer[eventName]);

    timer[eventName] = setTimeout(function(){
      if(config[eventName])
        terminal.emit(eventName);

      delete timer[eventName];
      self.config('timer', timer);
    });
  }

  return this;
};

/*
 *  Proxy some readline's Interface methods
 */
;['prompt', 'setPrompt'].forEach(function(method){

  Runtime.prototype[method] = function(/* arguments */){
    terminal[method].apply(terminal, [].slice.call(arguments));
    return this;
  };

});

/*
 * doc holder
 */

Runtime.prototype.startup = function(fn){

  if( fn === void 0 )
    terminal.emit('startup');
  else
    this.waiting('startup', fn);

  return this;
};

/*
 * doc holder
 */

Runtime.prototype.shutdown = function(fn){

  if( fn === void 0 )
    terminal.emit('shutdown');
  else
    this.waiting('shutdown', fn);

  return this;
};

/*
 * doc holder
 */

Runtime.prototype.require = function(str){

  assert( util.isString(arguments[0]) );

  // get and resolve the caller's path
  var site = caller()[1].getFileName();
      site = path.resolve(path.dirname(site), str);

  var dir, file, stat;
  try {
    stat = fs.statSync(site);

    if(stat.isFile())
      file = site;
    else if(stat.isDirectory())
      dir = fs.readdirSync(site);

  } catch(err){

    throw Herror.call(err,
      'runtime.require(`'+str+'`): file/folder `'+site+'` doesn\'t exists.'
    );
  }

  var fileExports = { };

  if(file)
    return require(file);

  dir.filter(function(fileName){

    var extension = path.extname(fileName);
    var test = /(\.(js|coffee)$)/i.test(extension);
    return test;

  }).forEach(function(moduleName){

    var id = path.basename(moduleName, path.extname(moduleName));
    moduleName = path.resolve(site, moduleName);
    fileExports[id] = require(moduleName);
  });


  return fileExports;
};
