
/*
 * Module dependencies
 */

var fs = require('fs');
var path = require('path');

var util = require('./utils');
var host = require('./host');
var Command = require('./command');

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

  return util.merge(
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
  var name = util.is(runtimeName).string ? runtimeName : '#root';
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
       util.assert( util.is(scopeValue).string );
       this.scope = scopeValue;
     }
  });

  util.merge(this, new Command(config));
  util.merge(this, host.getDefaults());
  //  -------------^
  //  - lexer
  //  - parser
  //  - consumer
  //  - completer

  // hook the instance to `readline`
  host.setRuntime(this);
  // default prompt
  this.setPrompt(' > '+name+' ');

  return this;
}

/*
 * doc holder
 */

Runtime.prototype.wire = function(command){

  util.assert( util.is(arguments[0]).string );

  terminal.emit('line', command);

  return this;
};

/*
 * doc holder
 */

Runtime.prototype.waiting = function(eventName, fn){

  util.assert( util.is(arguments[0]).string );

  var self = this;
  var len = arguments.length;
  var config = this.config();
  var scope = config.scope;
  var timer = this.config('timer');

  if( len === 1 ){
    return terminal.listeners(eventName);
  } else if( len === 2 ){

    util.assert( util.is(arguments[1]).function );

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

  util.assert( util.is(arguments[0]).string );

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
      throw new Herror(
        'runtime.require('+str+'): '+
        'is not a file or directory'
      );
    }

  } catch(err){

    throw Herror.call(err,
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
