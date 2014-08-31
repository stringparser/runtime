
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
 * function `create`
 *
 * @param {String} name
 * @return {Runtime} instance
 */

function create(name){

  var runtime = new Runtime(name);

  return runtime;
}
exports.create = create;

/*
 * doc holder
 */
function Runtime(runtimeName){

  if ( !(this instanceof Runtime) ){
    return new Runtime(runtimeName);
  }

  var scope = '';
  var config = {
    timer : { },
    nested : true,
    startup : true
  };

  var name = util.isString(runtimeName) ? runtimeName : '#root';
  Object.defineProperties(config, {
    name : {
             value : name,
          writable : false,
        enumerable : true,
      configurable : false
    },
    scope : {
      enumerable : true,
      configurable : true,
      get : function(){
        return scope;
      },
      set : function(scopeValue){
        assert( util.isString(scopeValue) );
        scope = scopeValue;
      }
    }
  });

  this.config = function (obj){

    var isString = util.isString(obj);
    var isObject = util.isObject(obj);
    var copy;

    if( !isString && !isObject )
      return merge({ }, config);

    if( isString )
      return config[obj];

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
  this.setPrompt(' > '+name+' ');

  // runtime as a config wrapper
  function runtime(config){

    runtime.config(config);
    return runtime;
  }
  merge(runtime, this);

  return runtime;
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

Runtime.prototype.get = function(stems){

  stems = Array.isArray(stems) ? stems : [].slice.call(arguments);

  return (
    new Command( this.config() )
  ).get(stems);
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

  assert( util.isString(arguments[0]) );

  // get and resolve the caller's path
  var dir;
  var stack = caller();
  var site = path.resolve( path.dirname(
    stack[1].getFileName()
  ), str);

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
  assert( util.isString(arguments[0]) );

  terminal.emit('line', command);

  return this;
};

/*
 * doc holder
 */

Runtime.prototype.waiting = function(eventName, fn){

  var self = this;
  var len = arguments.length;
  var config = this.config();
  var scope = config.scope;
  var timer = this.config('timer');


  assert( util.isString(arguments[0]) );

  if( len === 1 )
    return terminal.listeners(eventName);

  else
  if( len === 2 ){

    assert( util.isFunction(arguments[1]) );

    terminal.on(eventName, function(){
      fn.call( scope ? require(scope) : self );
    });

    if(timer[eventName])
      clearTimeout(timer[eventName]);

    timer[eventName] = setTimeout(function(){
      if(config[eventName])
        terminal.emit(eventName);
    });
  }

  return this;
};

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
 *  Proxy some readline's terminal methods
 */
var methods = ['prompt', 'setPrompt'];

methods.forEach(function(method){

  Runtime.prototype[method] = function(/* arguments */){
    terminal[method].apply(terminal, [].slice.call(arguments));
    return this;
  };

});
