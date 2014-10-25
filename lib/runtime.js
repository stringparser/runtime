'use strict';

/*
 * Module dependencies
 */
var fs = require('fs');
var path = require('path');
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

  // start a repl if so was asked
  var argv = util.argv(process.argv);
  this.isRepl = Boolean(argv.repl);
  if( typeof argv.repl === 'string' ){
    this.isRepl = JSON.parse(argv.repl);
  }
  this.repl(this.isRepl);

  // make some methods chainable
  var prompt = this.prompt;
  var setPrompt = this.setPrompt;

  this.prompt = function(/* arguments */){
    prompt.apply(this, arguments);
    return this;
  };
  this.setPrompt = function(/* arguments */){
    setPrompt.apply(this, arguments);
    return this;
  };

  on.line(this); // wire things up
}
util.inherits(Runtime, Interface);

/**
 * repl
 */

Runtime.prototype.repl = function(start, opts){
  opts = util.type(opts).plainObject || { };
  opts.input = util.type(this.input).match(/stream/);
  if( opts.input ){  this.close();  }
  if( !start ){
    Interface.call(this,
      opts.input || util.through(),
      util.type(opts.output).match(/stream/) || util.through(),
      util.type(opts.completer).function || this.completer.bind(this)
    );
    return this;
  }
  Interface.call(this,
    process.stdin,
    process.stdout,
    util.type(opts.completer).function || this.completer.bind(this)
  );
  on.keypress(this);
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
    return Boolean(line || !isDone || false);
  }

  return this;
};

/**
 * completer
 */
var _path = [ ];
Runtime.prototype.completer = function(line){
  var hits = [ ];
  var lexed = this.lexer(line);
  var lastStr = line.match(/[ ]+\S+$/);
  var completion = util.completionHelper(this, lexed);

  if( lastStr ){
    pathCompletion(lastStr[0]);
    completion = completion.concat(_path);
    line = line.substring(lastStr.index, line.length).trim();
  }

  hits = completion.filter(function(elem){
    return elem.indexOf(line) === 0;
  });

  return [ hits[0] ? hits : completion, line ];
};

/*
 * doc holder
 */

Runtime.prototype.require = util.requirem;


/**
 *
 */

function pathCompletion(partial){
  var cwd = process.cwd();
  if( !_path.length ){
    _path = fs.readdirSync(cwd).filter(function(pathname){
      return !(/^\.|node_modules/i).test(pathname);
    });
    _path.push('..');
  }
  //
  // return early for
  //  - no matches
  //  - something with extension
  //  - path does not match initial basedirs
  //
  partial = (partial || '').trim();
  var index;
  var basedir = partial.split(path.sep)[0];
  var resolved = path.resolve(cwd, partial);
  if( path.extname(partial) ){  return _path;  }
  if( _path.indexOf(partial) > -1 ){ return _path; }
  if( (index = _path.indexOf(basedir)) < 0 ){  return _path;  }

  try {
    var lstat = fs.lstatSync(resolved);
    if( !lstat.isDirectory() ){  return _path;  }
  } catch(err){ return _path; }
  // or didn't exist or wasn't a directory
  // not useful to throw for tab completion

  var notEmpty = false;
  fs.readdirSync(resolved)
    .forEach(function(pathname){
      if( _path.indexOf(pathname) > -1 ){  return ;  }
      _path.push(path.join(partial, pathname));
      notEmpty = true;
    });
  _path[index] += path.sep;
  return _path;
}
