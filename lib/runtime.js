
/*
 * Module dependencies
 */

var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var events = require('events');
var caller = require('callsite');
var assert = require('better-assert');

var util = require('./utils');
var host = require('./terminal');
var Command = require('./command/constructor');

var merge = util.merge;
var terminal = host.getInterface();

/*
 * doc holder
 */

exports = module.exports = {};

/*
 * doc holder
 */

function createInterface(name){

  if(!name)
    name = '#root';

  return new Runtime(name);
}
exports.createInterface = createInterface;

/*
 * doc holder
 */
var warehouse = {};

function getWarehouse(name){

  if(name)
    return warehouse[name];
  else
    return warehouse;
}
exports.getWarehouse = getWarehouse;

/*
 * doc holder
 */
function setWarehouse(name, obj){

  assert( util.isString(name) );
  assert( util.isObject(obj)  );

  warehouse[name] = obj;
}
exports.getWarehouse = getWarehouse;

/*
 * doc holder
 */
function Runtime(name){


  if ( !(this instanceof Runtime) ){
    return new Runtime(name);
  }

  if(!name){
    name = '#root';
  }

  // even if passed
  assert( util.isString(name) );

  var runtime;
  if( !warehouse[name] ){

    // instance's properties
    this._name = name;
    this._timer = {};

    // instance's functions:
    //  - lexer
    //  - parser
    //  - consumer
    //  - completer
    //  - config
    merge(this, host.getDefaults());

    var config = {};
    this.config = function(obj){

      if(util.isObject(obj)){
        merge(config, obj);
        return this;
      } else if(obj){
        return config[obj];
      } else {
        var target = merge({}, config);
        return target;
      }
    };

    // Wrapper
    runtime = function (config){

      if(config){
        runtime.config(config);
      }

      return runtime;
    };
    merge(runtime, this);

    // inform the host
    host.setRuntime(runtime);

    // setup the runtime's namespace
    Command.setRoot(name);

    return runtime;
  }
  else {

    runtime = new Runtime(name);

    // pull the events previously saved
    merge(runtime._events, warehouse[name]);

    return runtime;
  }
}
exports.Runtime = Runtime;

/*
 * doc holder
 */

Runtime.prototype.set = function(name, handle){

  return (
    new Command(this._name, this.config())
  ).set(name, handle);
};

/*
 * doc holder
 */

Runtime.prototype.get = function(/* arguments */){

  var args = Array.isArray(arguments[0]);
      args = args ? arguments[0] : [].slice.call(arguments);

  return (
    new Command(this._name, this.config())
  ).get(args);
};

/*
 * doc holder
 */

Runtime.prototype.handle = function(handle){

  return (
    new Command(this._name, this.config())
  ).handle(handle);
};

/*
 * doc holder
 */

Runtime.prototype.completion = function(stems){

  return (
    new Command(this._name, this.config())
  ).completion(stems);
};

/*
 * doc holder
 */

Runtime.prototype.require = function(str){

  if(typeof str !== 'string')
    throw new TypeError(' runtime.require arguments should be a `string`');

  // get and resolve the caller's path
  var stack = caller();
  var site = path.resolve(
    path.dirname(stack[1].getFileName())
  , str);

  var dir;
  try {
      dir = fs.readdirSync(site);
  }
  catch(error){

    error.message = (
      '[' + chalk.yellow('gulp-runtime') +'] \n '
      + util.quotify(error.message)
    )

    throw error;
  }

  dir.filter(function(fileName){

    return /(\.(js|coffee)$)/i.test(path.extname(fileName));
  }).forEach(function(moduleName){

    var modulePath = path.resolve(site, moduleName);
    try {
      require(modulePath);
    }
    catch(error){
      error.message = (
        '[' + chalk.yellow('gulp-runtime') +'] \n '
        + util.quotify(error.message)
      )
      throw error;
    }
  });

  return this;
}

/*
 * doc holder
 */

Runtime.prototype.waiting = function(eventName, fn){

  var timer = this._timer;
  var self = terminal;
  var scope = this.config('scope');

  if(!timer[eventName]){

    timer[eventName] = setTimeout(function(){
      self.emit(eventName);

      if(typeof fn === 'function')
        fn.call( scope ? scope : self );
    });

  } else {

    clearTimeout(timer.startup);
    timer[eventName] = setTimeout(function(){
      self.emit(eventName);

      if(typeof fn === 'function')
        fn.call( scope ? scope : self );
    });
  }

  return this;
};

/*
 * doc holder
 */

Runtime.prototype.onStartup = function(fn){

  var self = this;
  var scope = this.config('scope');

  this.waiting('startup', function(){
    fn.call( scope ? scope : self );
  });

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


/*
 * Order the prototype by key length
 * just to be nicer to `console.log`s
 */

util.prettyPrototype(Runtime);
