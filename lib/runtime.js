'use strict';

/*
 * Module dependencies
 */

var util = require('./utils');
var on = util.requirem('./on');
var Command = require('./command');
var Interface = require('readline').Interface;

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
  Interface.call(this,
    util.through(), util.through(),
    this.completer.bind(this)
  );
  // wire things up
  on.next(this).line(this);

  // make some methods chainable
  var self = this;
  var prompt = this.prompt, setPrompt = this.setPrompt;
  self.prompt = function(/* arguments */){
    prompt.apply(this, arguments);
    return this;
  };
  self.setPrompt = function(/* arguments */){
    setPrompt.apply(this, arguments);
    return this;
  };
  // default prompt
  self.setPrompt(' '+self.config('name')+' > ');
}
util.inherits(Runtime, Interface);

/**
 * lexer
 */

var pathCompletion = [ ];
Runtime.prototype.repl = function(start){
  debug('start', start);
  if( !start ){ return this; }
  // cleanup instance listeners
  this.close();
  // attach stdin and stdout
  Interface.call(this, {
        input : process.stdin,
       output : process.stdout,
    completer : this.completer.bind(this)
  });
  // for this.input.on('keypress')
  on.keypress(this);

  // path completion
  var wd = this.config('env').cwd || '.';
  wd = pathCompletion[0] || on.path(wd, pathCompletion);

  var promptText = this.config('prompt');
  debug('promptText', promptText);
  promptText = util.type(promptText).string
    ? this.setPrompt(promptText)
    : this.setPrompt(' '+this.config('name')+' > ');
  promptText = null;
  return this;
};

/**
 * lexer
 */

Runtime.prototype.lexer = function(line){
  var cmd = line
    .replace(/\d+|=\S+/g, '').trim().split(/[ ]+/);
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
      ' The default parser needs an `array` or a `string`.'
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

Runtime.prototype.consumer = function(argv, args, cmd){
  cmd = cmd || this.get(argv);
  var self = this;
  var isDone = null, scope = null;
  var usesNext = cmd.handle && cmd.handle.length > 2;
  debug('usesNext?', usesNext);

  if( cmd.handle ){
    debug('consuming', argv);
    scope = this.config('scope');
    cmd.handle.call(scope ? require(scope) : this,
      argv, args, next);
    if( !usesNext ){  next();  }
  }

  function next(_argv){
    argv = _argv || argv;
    argv = argv.slice(argv.indexOf(cmd._name) + 1);
    isDone = !(cmd._depth > 0 || cmd.children[argv[0]]);
    debug('isDone', isDone);
    debug('argv', argv);
    cmd = self.get(argv);
    return !isDone;
  }

  if( !isDone ){
    self.emit('next', argv, args, cmd);
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
