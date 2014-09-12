
/*
 * Module dependencies
 */

var util = require('./utils');
var readline = require('readline');
var Herror = require('herro').Herror;
var merge = util.merge;

/*
 * The default `Runtime` handlers
 */

var defaultRuntime = {
  lexer : require('./command/lexer'),
  parser : require('./command/parser'),
  consumer : require('./command/consumer'),
  completer : require('./command/completer')
};

/*
 * the runtime interface
 */

var host = new readline.Interface({
      input : process.stdin,
     output : process.stdout,
  completer : function(line){
    return getRuntime().completer(line);
  }
});

/*
 *
 */

host.on('line', function(line){

  line = line.trim();
  if(line === ''){
    this.emit('done');
  }
  else {

    var runtime = getRuntime();
    var argv = runtime.lexer(line);
    var args = runtime.parser(line);

    this.emit('next', argv, args);
  }
});

/*
 *
 */

host.on('next', function(argv, args, command){
  getRuntime().consumer(argv, args, command);
});

/*
 *
 */

host.on('done', function(line, args, index){
  this.prompt();
});

/*
 *
 */

host.input._events.keypress = function(s, key){

  if(key && key.ctrl && key.name === 'c'){
    process.exit(0);
  } else {
    host._ttyWrite(s, key);
  }

};


/*
 * Module exports
 */

exports = module.exports;

/*
 *
 */

function getInterface(){
  return host;
}
exports.getInterface = getInterface;

/*
 *
 */

var getDefaults = exports.getDefaults = function (){

  var copy = merge({}, defaultRuntime);
  return copy;
};

/*
 *
 */

var runtime;
var setRuntime = exports.setRuntime = function (handle){

  if( handle === void 0 ){
    throw new Herror(
      'host.setRuntime: Provide a handle to set.'
    );
  }
  else {
    runtime = handle;
  }
};
