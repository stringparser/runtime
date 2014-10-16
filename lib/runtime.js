'use strict';

/*
 * Module dependencies
 */

var tty = require('tty');
var readline = require('readline');

var util = require('./utils');
var Command = require('./command');
var on = util.requirem('./on');

var debug = util.debug(__filename);

/**
 * doc holder
 */
exports = module.exports = {
      get : getRuntime,
      set : createRuntime,
  Runtime : Runtime
};

/*
 * doc holder
 */

var warehouse = { };
function getRuntime(name){
  var rt = warehouse[name];
  return rt || createRuntime(name);
}

/**
 *
 */

function createRuntime(name, config){
  name = util.type(name).string || '#root';
  var runtime  = warehouse[name] = new Runtime(name, config);
  return runtime;
}

/**
 *
 */
var pathCompletion = [ ];
function Runtime(name, config){

  if( !(this instanceof Runtime) ){
    return new Runtime(name, config);
  }

  config = util.type(config).plainObject || { };
  config.name = util.type(name).string || '#root';
  config.repl = config.repl === false ? config.repl : true;

  util.merge(this, new Command(config));

  var input, output;
  input = util.type(config.input).stream;
  output = util.type(config.output).stream;

  if( config.repl ){
    input = input || new tty.WriteStream();
    output = output || new tty.WriteStream();
    process.stdin.setRawMode(true);
    process.stdin.pipe(input);
    output.pipe(process.stdout);
  }
  // attach readline's instance methods
  readline.Interface.call(this,
    input, output, this.completer.bind(this) );

  var sink = null;
  if( config.repl ){
    on.keypress(this);
    this.setPrompt(' > '+this.config('name')+' ');
    sink = pathCompletion[0] || on.path('.', pathCompletion);
  }

  // wire things up
  on.line(this).wire(this).next(this);
}
util.inherits(Runtime, readline.Interface);

/**
 * lexer
 */

Runtime.prototype.lexer = function(line){
  var cmd = line
    .replace(/\d+|=\S+/g, '')
    .split(/[ ]+/);
  debug('cmd', cmd);
  return cmd || [ ];
};

/**
 * parser
 */

Runtime.prototype.parser = function(line){
  line = util.type(line);
  if( !line.match(/string|array/) ){
    throw new util.Error(
      ' '+this.config('name')+'.parser: '+
      ' The default parser needs an array or an `string`.'
    );
  }
  return util.argv(
    (line.string || line.array.join(' '))
    .replace(/(--|-)(\S+)/g, function($0, $1, $2){
      return $1 + util.camelcase($2);
    }).split(/[ ]+/)
  );

};

/**
 * consumer
 */

Runtime.prototype.consumer = function(argv, args, next){
  var cmd = this.get(argv);
  var scope = null;
  if( cmd.handle ){
    scope = this.config('scope');
    scope = scope ? scope : this;
    cmd.handle.call(scope, argv, args, next);
    debug('consumed', argv, args);
  }
};

/**
 * completer
 */

Runtime.prototype.completer = function(line){
  var hits = [];
  var lexed = this.lexer(line);
  var completion = completionHelper(this, lexed);
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
};

/*
 * doc holder
 */

Runtime.prototype.require = util.requirem;

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
