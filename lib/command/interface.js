
/*
 * Module dependencies
 */

var readline = require('readline');
var util = require('../utils');

var merge = util.merge;

/*
 *
 */

var xInterface = new readline.Interface({
      input : process.stdin,
     output : process.stdout,
  completer : function(line){
    return getRuntime().completer(line);
  }
})

/*
 *
 */

xInterface.on('line', function(line){

  line = line.trim();
  if(line === ''){
    this.emit('done');
  }
  else {

    var args = getRuntime().parser(line);
    var argv = getRuntime().interpreter(line);

    this.emit('next', argv, args);
  }
})

/*
 *
 */

xInterface.on('next', function(argv, args){

  getRuntime().terminal(argv, args);
})

/*
 *
 */

xInterface.on('done', function(line, args, index){

  if(line)
    console.log(' `%s` done\n', JSON.stringify(line));
  else
    console.log(' `` done\n');

  this.prompt();
})

/*
 * The default `Runtime` handle
 */

var xRuntime = {
  parser : require('./parser'),
  terminal : require('./terminal'),
  consumer : require('./consumer'),
  completer : require('./completer'),
  interpreter : require('./interpreter')
}

/*
 * Module exports
 */

exports = module.exports;

/*
 *
 */

function getInterface(name){

  if(!name)
    return xInterface;
  else
    return xInterface[name];
}
exports.getInterface = getInterface;

/*
 *
 */

function getDefaults(){

  var target = merge({}, xRuntime);
  return target;
}
exports.getDefaults = getDefaults;

/*
 *
 */

var runtime;
function setRuntime(handle){

  if(util.isUndefined(handle))
    throw new Error(' Provide a handle to set.')
  else
    runtime = handle;
}
exports.setRuntime = setRuntime;

/*
 *
 */

function getRuntime(){

  if(util.isUndefined(runtime)){
    var target = merge({}, xRuntime);
    return target;
  }
  else {
    return runtime;
  }
}
exports.getRuntime = getRuntime;