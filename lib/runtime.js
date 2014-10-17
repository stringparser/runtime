'use strict';

/*
 * Module dependencies
 */

var util = require('./utils');
var on = util.requirem('./on');
var readline = require('readline');
var Command = require('./command');

var debug = util.debug(__filename);

/**
 * doc holder
 */
exports = module.exports = {
      get : getRuntime,
   create : createRuntime,
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
function Runtime(name, opts){

  if( !(this instanceof Runtime) ){
    return new Runtime(name, opts);
  }

  opts = util.type(opts).plainObject || { };
  opts.name = util.type(name).string || '#root';

  util.merge(this, new Command(opts));
  opts.input = util.through();
  opts.output = util.through();
  opts.completer = this.completer.bind(this);

  var self = this;
  var prompt = this.propmt;
  var setPrompt = this.setPrompt;
  self.prompt = function(/* arguments */){
    prompt.apply(this, arguments);
    return this;
  };
  self.setPrompt = function(/* arguments */){
    setPrompt.apply(this, arguments);
    return this;
  };
  // attach readline's instance methods
  readline.Interface.call(this, opts);
  on.line(this)  // on line listener
    .wire(this)  // on wire
    .next(this); // on next command
}
util.inherits(Runtime, readline.Interface);

/**
 * lexer
 */

var pathCompletion = [ ];
Runtime.prototype.repl = function(start, cwd){
  if( !this.config('repl') ){ return ; }
  this.close();
  readline.Interface.call(this,
    process.stdin,
    process.stdout,
    this.completer.bind(this)
  );
  if( !pathCompletion[0] ){
    on.path( util.type(cwd).string || '.', pathCompletion);
  }
  this.setPrompt(' '+this.config('name')+' > ');
  on.keypress(this);
  return this;
};

/**
 * lexer
 */

Runtime.prototype.lexer = function(line){
  var cmd = line
    .replace(/\d+|=\S+/g, '').split(/[ ]+/);
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
    var spaceEnd = line.match(/[ ]+\S+$/);
    if( spaceEnd ){
      line = line.substring(spaceEnd.index, line.length).trim();
    }
    completion = completion.concat(pathCompletion.slice() || []);
  }

  debug('line = ', line);
  debug('lexed = ', lexed);
  debug('completion =', completion);

  lexed.forEach(function(elem){
    var index = completion.indexOf(elem);
    if( index > -1 ){ completion.splice(index, 1); }
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
  var completion = [ ];
  var cmd = runtime.get(stems);
  var anchor = runtime.get(cmd._parent);
  (cmd.completion || [ ])
    .concat(anchor.completion || [ ]).forEach(function(elem){
      if(completion.indexOf(elem) < 0){
        completion.push(elem);
      }
  });
  return completion;
}
