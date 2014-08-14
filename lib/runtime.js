
/*
 * Module dependencies
 */

var fs = require('fs');
var path = require('path');
var util = require('./utils');
var host = require('./terminal');
var Command = require('./command');

var terminal = host.getInterface();

var merge = util.merge;
var color = util.color;
var assert = util.assert;
var caller = util.callsite;
var __slice = [].slice;

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
      config = {
           name : name ? name : '#root',
          timer : {},
         nested : true,
        startup : true
      };

  if ( !(this instanceof Runtime) ){
    return new Runtime(name);
  }

  if(arguments.length === 1){
    // even if you passed slytherin
    assert( util.isString(arguments[0]) );
  }

  this.config = function(obj){

    var args = arguments;

    if(args.length === 0){

      var target = merge({ }, config);
      return target;

    } else if( util.isString(obj) ){

      if( obj !== 'name' ){
        return config[obj];
      }
      else {
        var copy = config[obj];
        return copy;
      }

    } else if( util.isObject(obj) ){

      if ( obj.name ) {
        throw new Error(
          config.name+'.config: The name of the instance can\'t be overriden. '
        );
      }

      if( obj.scope)
        assert( util.isString(obj.scope) )

      merge(config, obj);

      return this;

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

  host.setRuntime(runtime);
  Command.setRoot(name);

  this.setPrompt(' > '+name+' ');

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

Runtime.prototype.get = function(/* arguments */){

  arguments = arguments.length === 1
    ? arguments[0]
    : __slice.call(arguments);

  return (
    new Command( this.config() )
  ).get(arguments);
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

Runtime.prototype.fetch = function(command){

  return Command.fetch(command);
}

/*
 * doc holder
 */

Runtime.prototype.clone = function(fileName){

  return Command.clone(fileName);
}

/*
 * doc holder
 */

Runtime.prototype.require = function(str){

  assert( util.isString(str) );

  // get and resolve the caller's path
  var stack = caller();
  var site = path.resolve(
    path.dirname(stack[1].getFileName())
  , str);

  var dir = fs.readdirSync(site);

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
}

/*
 * doc holder
 */

Runtime.prototype.wire = function(command){

  assert( arguments.length === 1);
  assert( util.isString(command) );

  terminal.emit('line', command);

  return this;
}

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

  if( !fn ){
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

  if( !fn ){
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


/*
 * Order the prototype by key length
 * just to be nicer to `console.log`s
 */

util.orderObject(Runtime.prototype);
