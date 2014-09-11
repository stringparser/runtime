
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

var terminal = {
      input : process.stdin,
     output : process.stdout,
  completer : function(line){
    return getRuntime().completer(line);
  }
};

var terminal = new readline.Interface(terminal);

/*
 *
 */

terminal.on('line', function(line){

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

terminal.on('next', function(argv, args, command){
  getRuntime().consumer(argv, args, command);
});

/*
 *
 */

terminal.on('done', function(line, args, index){
  this.prompt();
});

/*
 *
 */

terminal.input.on('keypress', function(key){
  if(key.ctrl && key.name === 'c')
    process.exit(0);
});


/*
 * Module exports
 */

exports = module.exports;

/*
 *
 */

function getInterface(name){

  if(!name)
    return terminal;
  else
    return terminal[name];
}
exports.getInterface = getInterface;

/*
 *
 */

var getDefaults = exports.getDefaults = function (){

  var target = merge({}, defaultRuntime);
  return target;
};

/*
 *
 */

var runtime;
var setRuntime = exports.setRuntime = function (handle){

  if( handle === void 0 ){
    throw new Herror(
      'terminal.setRuntime: Provide a handle to set.'
    );
  }
  else {
    runtime = handle;
  }
};

/*
 *
 */

var getRuntime = exports.getRuntime = function (){

  if( runtime === void 0 ){
    var target = merge({}, defaultRuntime);
    return target;
  }
  else {
    return runtime;
  }
};
