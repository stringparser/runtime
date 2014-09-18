'use strict';

/*
 * Module dependencies
 */

var util = require('./utils');

exports = module.exports = { };
exports.attach = attach;

/**
 * function `createHost`
 */

function attach(runtime){


  /**
   * defaults
   *
   * path completion,
   * helper functions,
   * readline as host
   */

  var completion = [ ];
  var finder = require('findit')('.');
  var path = require('path');

  finder.on('path', function(file){

    var test = (/^.git|node_modules|^\./i).test(file);
        test = !test && !(/^test/i).test(file);

    if( test && path.extname(file).match(/\.(js|coffee)/) ){
      completion.push(file);
      runtime.config('completion', completion);
    }
  });

  util.merge(runtime, {
    lexer : require('./command/lexer'),
    parser : require('./command/parser'),
    consumer : require('./command/consumer'),
    completer : require('./command/completer')
  });

  var host = require('readline').createInterface({
        input : process.stdin,
       output : process.stdout,
    completer : function(line){
      return runtime.completer(line);
    }
  });

  host.input._events.keypress = function(s, key){

    if(key && key.ctrl && key.name === 'c'){
      process.stdout.write('\n');
      process.exit(0);
    } else {
      host._ttyWrite(s, key);
    }
  };

  /**
   * host events
   */

  host.on('line', function(line){

    var lineIs = util.type(line || ' ');

    if( lineIs.array ){
      line = line.join(' ');
    } else if( !lineIs.string ){
      throw new util.Error(
        'runtime.on("wire", function(line){ /* ... */}): '+
        'line should be a `string` or `array`'
      );
    }

    line = line.trim();
    if( !line[0] ){
      return this.prompt();
    }

    runtime.emit('wire', line);
  });

  /**
   * runtime events
   *
   * `wire` is the main runtime event
   */

  runtime.on('wire', function(line){

    var argv = this.lexer(line);
    var args = this.parser(line);

    if( util.completion(this, line).indexOf(argv[0]) > -1 ){
      this.emit('next', argv, args);
    } else {
      this.emit('message', {
         prompt : true,
        quotify : 'yellow',
        message : 'command `'+argv[0]+'` not found'
      });
    }

  });

  runtime.on('next', function(argv, args, command){
    this.consumer(argv, args, command);
  });

  /**
   * host-specific runtime functions
   */

  runtime.prompt = function(preserveCursor){
    host.prompt(preserveCursor);
    return this;
  };

  runtime.setPrompt = function(text, len){
    host.setPrompt(text, len || text.length);
    return this;
  };

  runtime.write = function(/*arguments*/){
    host.write.apply(host, arguments);
    return this;
  };

  host.setPrompt(' > '+runtime.config('name')+' ');

  return runtime;
}
