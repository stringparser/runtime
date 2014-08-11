
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

exports = module.exports = { };

/*
 * doc holder
 */
var warehouse = { };

function setWarehouse(name, obj){

  assert( util.isString(name) );
  assert( util.isObject(obj)  );

  warehouse[name] = obj;
}
exports.setWarehouse = setWarehouse;
/*
 * doc holder
 */
function getWarehouse(name){

  var target = merge({ }, warehouse);
  if(name)
    return target[name];
  else
    return target;
}
exports.getWarehouse = getWarehouse;


/*
 * doc holder
 */

function createInterface(name, opt){

  var runtime = new Runtime(name);

  if(!warehouse[name]){

    //
    // # Refs to restore setup
    //
    var source = { };
    warehouse[name] = source;
    // ## events
    source._events = terminal._events;
    // ## config
    source.config = runtime.config();
    // ## instance's methods
    source.lexer = runtime.lexer;
    source.parser = runtime.parser;
    source.consumer = runtime.consumer;
    source.completer = runtime.completer;
  }
  else {
    //
    // # Restore setup
    //
    var target = warehouse[name];

    //
    // ## readline's interface events
    //
    terminal._events = target._events;

    //
    // ## configuration
    //
    runtime.config(target.config);

    //
    // ## methods
    //
    runtime.lexer = target.lexer;
    runtime.parser = target.parser;
    runtime.consumer = target.consumer;
    runtime.completer = target.completer;
  }

  return runtime;
}
exports.createInterface = createInterface;

/*
 * doc holder
 */
function Runtime(name){

  // hoist'em already!
  var runtime,
      config = { };

  if ( !(this instanceof Runtime) ){
    return new Runtime(name);
  }

  // if no name you are #root!
  if(!name){
    name = '#root';
  }
  else {
    // even if passed you slizering
    assert( util.isString(name) );
  }

  // instance properties
  this._name = name;
  this._timer = { };

  //
  // # `runtime` config
  // Note: keep it clean for instantiation
  this.config = function(obj){

    var test = util.isString(obj)
      || util.isObject(obj)
      || util.isUndefined(obj);

    if(!test) {
      console.log('Not supported type for `runtime.config(obj)`\n')
      assert( util.isString(obj) || util.isObject(obj) || util.isUndefined(obj) );
    }

    if( util.isString(obj) ){

      return config[obj];

    } else if( util.isObject(obj) ){

      if(obj.scope){
        assert( util.isString(obj.scope) )
      }

      merge(config, obj);
      return this;

    } else if( util.isUndefined(obj) ){
      return merge({ }, config);
    }
  };

  // instance methods
  //  - lexer
  //  - parser
  //  - consumer
  //  - completer
  merge(this, host.getDefaults());

  // runtime as a config wrapper
  runtime = function (config){

    runtime.config(config);

    return runtime;
  };
  merge(runtime, this);

  // inform the host
  host.setRuntime(runtime);

  // setup the runtime's namespace
  Command.setRoot(name);

  return runtime;

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

Runtime.prototype.import = function(command){

  return Command.import(commnad);
}

/*
 * doc holder
 */

Runtime.prototype.export = function(fileName){

  return Command.export(fileName);
}

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
  var self = this;
  var scope = this.config('scope');

  if(!timer[eventName]){

    timer[eventName] = setTimeout(function(){

      if(eventName === 'startup')
        terminal.emit(eventName);

      if(typeof fn === 'function')
        fn.call( scope ? scope : self );
    });

  } else {

    clearTimeout(timer.startup);
    timer[eventName] = setTimeout(function(){

      if(eventName === 'startup')
        terminal.emit(eventName);

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
 * doc holder
 */

Runtime.prototype.onSwitch = function(fn){

  var self = this;
  var scope = this.config('scope');

  this.waiting('switch', function(){
    fn.call( scope ? scope : self )
  })

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
