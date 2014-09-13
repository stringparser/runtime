
/*
 * Module dependencies
 */

var util = require('./utils');

exports = module.exports = createHost;

/**
 * function `createHost`
 */

function createHost(runtime){

  /**
   * default host is readline
   */

  var host = new require('readline').Interface({
        input : process.stdin,
       output : process.stdout,
    completer : runtime.completer
  });

  host.input._events.keypress = function(s, key){

    if(key && key.ctrl && key.name === 'c'){
      process.exit(0);
    } else {
      exports._ttyWrite(s, key);
    }
  };

  /**
   * main runtime event
   */

  runtime.on('wire', function(command){
    host.emit('line', command);
  });

  /**
   * path completion
   */

  var completion = [ ];
  var finder = require('findit')('.');

  finder.on('path', function(file, stat){

    var test = (/^.git|node_modules|^\./i).test(file);
        test = !test && (/(\.(js|coffee)$)/i).test(file);

    if( test ){
      completion.push(file);
    }
  });

  finder.on('end', function(){
    runtime.config({
      completion : completion
    });
  });

  /**
   * host events
   */

  host.on('line', function(line){
    line = line.trim();
    if(line === ''){
      runtime.emit('done');
    } else {

      var argv = runtime.lexer(line);
      var args = runtime.parser(line);

      runtime.emit('next', argv, args);
    }
  });

  /**
   * runtime events
   */

  runtime.on('next', function(argv, args, command){
    runtime.consumer(argv, args, command);
  });

  runtime.on('done', function(){
    host.prompt();
  });

  /**
   * host-specific runtime functions
   */

  util.merge(runtime, {
    lexer : require('./command/lexer'),
    parser : require('./command/parser'),
    consumer : require('./command/consumer'),
    completer : require('./command/completer')
  });

  runtime.prompt = function(){
    host.prompt();
  };

  runtime.setPropmt = function(text, len){
    text = text || ' > ' + runtime.config('name') + ' ';
    host.setPrompt(text, len || text.length);
  };

  return host;
}
