
/*
 * Module dependencies
 */

var fs = require('fs');
var path = require('path');
var Herror = require('herro').Herror;

var util = require('./utils');
var host = require('./host');

var merge = util.merge;
var assert = util.assert;
var caller = util.callsite;
var terminal = host.getInterface();
/*
 * runtime prototype
 */

var runtime = { };

/*
 * doc holder
 */

runtime.require = function(str){

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
      'runtime.require(`'+str+'`): file/folder `'+site+'` doesn\'t exists.'
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

runtime.wire = function(command){

  assert( util.isString(arguments[0]) );

  terminal.emit('line', command);

  return this;
};

/*
 * doc holder
 */

runtime.waiting = function(eventName, fn){

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
 * doc holder
 */

runtime.startup = function(fn){

  if( fn === void 0 )
    terminal.emit('startup');
  else
    this.waiting('startup', fn);

  return this;
};

/*
 * doc holder
 */

runtime.shutdown = function(fn){

  if( fn === void 0 )
    terminal.emit('shutdown');
  else
    this.waiting('shutdown', fn);

  return this;
};



/*
 *  Proxy some readline's Interface methods
 */
;['prompt', 'setPrompt'].forEach(function(method){

  runtime[method] = function(/* arguments */){
    terminal[method].apply(terminal, [].slice.call(arguments));
    return this;
  };

});

/*
 * Expose the prototype
 */

exports = module.exports = runtime;
