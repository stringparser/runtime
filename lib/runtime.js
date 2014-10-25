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
      get : get,
   create : create,
  Runtime : Runtime
};

/**
 * doc holder
 */

var warehouse = { };
function get(name){
  return warehouse[name] || create(name);
}

/**
 * doc holder
 */

function create(name, config){
  name = util.type(name).string || '#root';
  return (warehouse[name] = new Runtime(name, config));
}

/**
 * doc holder
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
  var makeRepl = Boolean(argv.repl);
  if( typeof argv.repl === 'string' ){
    makeRepl = JSON.parse(argv.repl);
  }
  this.repl(makeRepl);

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

  if( !this.output.isTTY ){ return this; }
  on.keypress(this);
  this.setPrompt(' > ');
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
      util.type(opts.completer).function
      || this.completer.bind(this)
    );
    return this;
  }
  Interface.call(this,
    process.stdin,
    process.stdout,
    util.type(opts.completer).function
    || this.completer.bind(this)
  );
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
  var args = util.argv(
    (line.string || line.array.join(' '))
    .replace(/(--|-)(\S+)/g, function($0, $1, $2){
      return $1 + util.camelcase($2);
    }).split(/[ ]+/)
  );
  args.hrtime = process.hrtime();
  return args;

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

  if( isDone ){
    args.time = util.prettyTime(process.hrtime(args.hrtime));
    self.emit('done', argv, args);
  }

  if( cmd.handle ){
    scope = scope ? require(scope) : this;
    argv = argv.slice(argv.indexOf(cmd._name) + 1);
    cmd.handle.call(scope, argv, args, next);
    usesNext = usesNext || next();
  }

  function next(line){
    debug('line', line, 'argv', argv);
    debug(cmd._name, 'isDone?', isDone);
    if( line ){  self.emit('next', line);  }
    if( !isDone ){  self.consumer(argv, args);  }
    return Boolean(line || !isDone || false);
  }

  return this;
};

Runtime.prototype.next = function(line, opts){
  opts.parallel = opts.series === void 0;
  var self = this;
  function onNext(){  self.emit('next', line);  }
  if( opts.series   ){  this.once('done', onNext);  }
  if( opts.parallel ){  onNext();  }
  return this;
};

/**
 * completer
 */
var _path = [ ];
Runtime.prototype.completer = function(line, callback){
  var hits = [ ];
  var match = line.match(/[ ]+\S+$|[ ]+$/);
  var completion = util.getCompletion(this, line);

  if( match ){
    pathCompletion(match[0]);
    line = line.substring(match.index, line.length).trim();
  }

  hits = completion.concat(_path).filter(function(elem){
    return elem.indexOf(line) === 0;
  });
  callback(null, [ hits.length ? hits : completion, line ]);
};

/*
 * doc holder
 */

Runtime.prototype.require = util.requirem;


/**
 * find path Completion
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
