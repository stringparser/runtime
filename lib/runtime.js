
/*
 * Module dependencies
 */

var fs = require('fs');
var path = require('path');
var Herror = require('herro').Herror;

var util = require('./utils');
var host = require('./terminal');
var Command = require('./command');

var merge = util.merge;
var color = util.color;
var assert = util.assert;
var caller = util.callsite;
var terminal = host.getInterface();

/*
 * doc holder
 */

exports = module.exports = { };

/*
 * doc holder
 */

function create(name, opt){

  var runtime = new Runtime(name);

  // runtime as a config wrapper
  function wrapper(config){

    runtime.config(config);
    return runtime;
  }
  merge(runtime, wrapper);

  return runtime;
}
exports.create = create;

/*
 * doc holder
 */
function Runtime(name){

  if ( !(this instanceof Runtime) ){
    return new Runtime(name);
  }

  var config = {
     nested : true,
    startup : true
  };

  var scope = '';
  Object.defineProperties(config, {
    name : {
          writable : false,
        enumerable : true,
      configurable : false,
      value : util.isString(name) ? name : '#root'
    },
    scope : {
      enumerable : true,
      configurable : true,
      get : function(){
        var copy = scope;
        return scope;
      },
      set : function(value){
        assert( util.isString(value) );
        scope = value;
      }
    }
  });

  this.config = function (obj){

    var isString = util.isString(obj);
    var isObject = util.isObject(obj);
    var copy;

    if( !isString && !isObject ){
       copy = merge({ }, config);
      return copy;
    }

    if( isString ) {
      copy = config[obj];
      return copy;
    }

    merge(config, obj);
    return this;
  };

  // instance methods
  //  - lexer
  //  - parser
  //  - consumer
  //  - completer
  merge(this, host.getDefaults());

  host.setRuntime(this);
  Command.setRoot(name);

  this.setPrompt(' > '+name+' ');
}
exports.Runtime = Runtime;

/*
 * doc holder
 */

Runtime.prototype.set = function(name, handle){

  return (
    new Command( this.config() )
  ).set(name, handle);
};

/*
 * doc holder
 */

Runtime.prototype.get = function(/* arguments */){

  return (
    new Command( this.config() )
  ).get( [].slice.call(arguments) );
};

/*
 * doc holder
 */

Runtime.prototype.handle = function(handle){

  return (
    new Command( this.config() )
  ).handle(handle);
};

/*
 * doc holder
 */

Runtime.prototype.completion = function(stems){

  return (
    new Command( this.config() )
  ).completion(stems);
};

/*
 * doc holder
 */

Runtime.prototype.require = function(str){

  assert( util.isString(str) );

  // get and resolve the caller's path
  var stack = caller();
  var site = path.resolve( path.dirname(
    stack[1].getFileName()
  ), str);

  var dir;
  try {
    dir = fs.readdirSync(site);
  } catch(e){
    throw Herror.call(e,
      'runtime.require(str): file/folder `'+site+'` doesn\'t exists.'
    );
  }

  dir.filter(function(fileName){

    var extension = path.extname(fileName);
    var test = /(\.(js|coffee)$)/i.test(extension);
    return test;

  }).forEach(function(moduleName){

    require(
      path.resolve(site, moduleName)
    );

  });

  return this;
};

/*
 * doc holder
 */

Runtime.prototype.wire = function(command){

  assert( arguments.length === 1);
  assert( util.isString(command) );

  terminal.emit('line', command);

  return this;
};

/*
 * doc holder
 */

Runtime.prototype.waiting = function(eventName, fn){

  var len = arguments.length;

  var self = this;
  var timer = this.config('timer');
  var scope = this.config('scope');
  var config = this.config();

  if( len === 1 ){

    assert( util.isString(arguments[0]) );

    return terminal.listeners(eventName);
  }
  else if( len === 2 ){

    assert( util.isString(arguments[0]) );
    assert( util.isFunction(arguments[1]) );

    if(timer[eventName]){
      clearTimeout(timer[eventName]);
    }

    timer[eventName] = setTimeout(function(){

      if(typeof fn === 'function'){
        fn.call( scope ? require(scope) : self );
      }

      if(config[eventName]){
        terminal.emit(eventName);
      }

    });
  }

  return this;
};

/*
 * doc holder
 */

Runtime.prototype.startup = function(fn){

  if( fn === void 0 ){
    terminal.emit('startup');
  }
  else {
    this.waiting('startup', fn);
  }

  return this;
};

/*
 * doc holder
 */

Runtime.prototype.shutdown = function(fn){

  if( util.Falsy(fn) ){
    terminal.emit('shutdown');
  }
  else {
    this.waiting('shutdown', fn);
  }

  return this;
};



/*
 *  Proxy some readline's terminal methods
 */
var methods = ['prompt', 'setPrompt'];

methods.forEach(function(method){

  Runtime.prototype[method] = function(/* arguments */){
    terminal[method].apply(terminal, [].slice.call(arguments));
    return this;
  };

});
