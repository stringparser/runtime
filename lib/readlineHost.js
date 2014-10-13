'use strict';

var path = require('path');
var readline = require('readline');
var util = require('./utils');
var findit = require('findit');
var debug = util.debug(__filename);

exports = module.exports = readlineHost;

/**
 * Start getting the path completion right away
 */
var pathCompletion = [ ];
findit('.').on('path', function(file){
  var test = (/^.git|node_modules|^\./i).test(file);
      test = !test && !(/^test/i).test(file);

  if( test && path.extname(file).match(/\.(js|coffee)/) ){
    pathCompletion.push(file);
  }
});

/**
 * host the runtime with readline
 */
function readlineHost(runtime){

  var host = readline.createInterface({
        input : process.stdin,
       output : process.stdout,
    completer : function(line){
      return completerFn(runtime, line);
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
    runtime.emit('wire', line);
  });

  /**
   * runtime events
   *
   * `wire` is the main runtime event
   */

  runtime.on('wire', function(line){

    if( typeof line !== 'string' ){
      throw new util.Error(
        'runtime.wire(line): '+
        '`line` should be a `string`'
      );
    }

    line = line.trim();
    if( !line ){
      return this.prompt();
    }

    var argv = lexer(this, line);
    var args = parser(this, line);
    var completion = completionHelper(this, line);

    if( completion.indexOf(argv[0]) > -1 ){
      this.emit('next', argv, args);
    } else {
      this.emit('message', {
         prompt : true,
        quotify : 'yellow',
        message : 'command `'+argv[0]+'` not found'
      });
    }

  });

  runtime.on('next', function(argv, args){
    consumer(this, argv, args);
  });

  /**
   * proxy some host-specific functions
   */

  runtime.prompt = function(preserveCursor){
    host.prompt(preserveCursor);
    return this;
  };

  runtime.setPrompt = function(text, len){
    host.setPrompt(text, len || text.length);
    return this;
  };

  host.setPrompt(' > '+runtime.config('name')+' ');
}

/**
 *
 */
function lexer(runtime, line){
  var cmd = line.replace(/(\d+|=\S+)/g, '').split(/[ ]+/);
  debug('cmd', cmd);
  return cmd !== null ? cmd : [ ];
}

/**
 *
 */
function parser(runtime, line){
  line = util.type(line);
  if( line.array ){
    return util.argv(line.array);
  } else if( line.string ){
    return util.argv(line.string.split(/[ ]+/));
  }
  throw new util.Error(
    ' '+runtime.config('name')+'.parser: '+
    ' The default parser needs an array or an `string`.'
  );
}

/**
 *
 */
function consumer(runtime, argv, args){

  if( !argv[0] ){  return ; }
  var cmd = runtime.get(argv);
  var scope = runtime.config('scope');

  debug('argv\n', argv, '\n args\n', args);
  debug('cmd.handle', cmd.handle);

  if( cmd.handle ){
    scope = scope ? require(scope) : runtime;
    cmd.handle.call(scope, argv, args, next);
    debug('consumed', argv, args);
  }

  function next(/* arguments */){
    [].unshift.call(arguments, 'next');
    runtime.emit.apply(runtime, arguments);
  }
}

/**
 *
 */
function completerFn(runtime, line){

  var hits = [];
  var lexed = lexer(runtime, line);
  var completion = completionHelper(runtime, lexed);

  if( line.match(/[ ]+/) ){

    completion = completion.concat(pathCompletion.slice() || []);
    var spaceEnd = line.match(/[ ]+\S+$/);
    if( spaceEnd ){
      line = line.substring(spaceEnd.index, line.length).trim();
    }
  }

  debug('line = ', line);
  debug('lexed = ', lexed);
  debug('completion =', completion);

  lexed.forEach(function(elem){
    var index = completion.indexOf(elem);
    if( index > -1 ){
      completion.splice(index, 1);
    }
  });

  hits = completion.filter(function(elem){
    return elem.indexOf(line) === 0;
  });

  debug('hits', hits);

  return [ hits[0] ? hits : completion, line ];
}

/**
 *
 */

function completionHelper(runtime, stems){

  var cmd = runtime.get(stems);
  var anchor = runtime.get(cmd._parent);
  var completion = [ ];

  (cmd.completion || [ ])
    .concat(anchor.completion || [ ]).forEach(function(elem){
      if(completion.indexOf(elem) < 0){
        completion.push(elem);
      }
  });

  return completion;
}
