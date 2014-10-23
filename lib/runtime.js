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
    /* this.input  */
    util.through(),
    /* this.output */
    util.through(),
    this.completer.bind(this)
  );
  // wire things up
  on.line(this);

  // make some methods chainable
  var self = this;
  var prompt = this.prompt;
  var setPrompt = this.setPrompt;

  self.prompt = function(/* arguments */){
    prompt.apply(this, arguments);
    return this;
  };
  self.setPrompt = function(/* arguments */){
    setPrompt.apply(this, arguments);
    return this;
  };

  // start a repl if so was asked
  if( this.parser(process.argv).repl ){
    self.repl(true);
  }
}
util.inherits(Runtime, Interface);

/**
 * lexer
 */

var pathCompletion = [ ];
Runtime.prototype.repl = function(start){
  debug('start', start);
  if( !start ){  return this;  }
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
  var wd = process.cwd();
  wd = pathCompletion[0] || on.path(wd, pathCompletion);

  return this;
};

/**
 * lexer
 */

Runtime.prototype.lexer = function(line){
  var cmd = line.replace(/\d+|=\S+/g, '')
    .trim().split(/[ ]+/);
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

Runtime.prototype.consumer = function(argv, args){
  var self = this;
  var cmd = this.get(argv);
  var scope = this.config('scope');
  var isDone = !(cmd._depth > 0 || cmd.children[argv[0]]);
  var usesNext = Boolean(cmd.handle && cmd.handle.length > 2);
  debug('usesNext?', usesNext, 'argv', argv);

  if( cmd.handle ){
    scope = scope ? require(scope) : this;
    argv = argv.slice(argv.indexOf(cmd._name) + 1);
    cmd.handle.call(scope, argv, args, next);
    usesNext = usesNext || next();
  }

  function next(line){
    debug('line', line, 'argv', argv);
    debug(cmd._name, 'isDone?', isDone);
    if( line ){  self.emit('line', line);  }
    else if( !isDone ){  self.consumer(argv, args);  }
    return Boolean(line || !isDone || false );
  }

  return this;
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
