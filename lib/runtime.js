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

  var config = util.type(opts).plainObject || { };
  util.merge(this, new Command(config));

  Interface.call(this, {
      input : util.type(opts.input).match(/stream/)
      || util.through.obj(),
     output : util.type(opts.output).match(/stream/)
      || util.through.obj(),
  completer : util.type(opts.completer).function
      || this.completer.bind(this)
  });
  // wire the 'next' event
  on.next(this);

  if( this.terminal ){
    this.key = { };
    on.keypress(this);
    // the default prompt
    this.setPrompt(' > ');
  } else { this.setPrompt(''); }

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
}
util.inherits(Runtime, Interface);

/**
 * doc holder
 */

/**
 * doc holder
 */

Runtime.prototype.require = util.requirem;

/**
 * lexer
 */

Runtime.prototype.lexer = function(line){
  return (
    (util.boil(line).join(' ') || '')
      .replace(/\d+|=\S+/g, '').trim()
      .split(/[ ]+/)
  );
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
  var done = !cmd._depth;
  var scope = this.config('scope');

  if( cmd.handle ){
    argv = argv.slice(cmd._depth);
    scope = scope ? require(scope) : this;
    cmd.handle.call(scope, argv, args, next);
    if( cmd.handle.length < 3 ){  next();  }
  }
  debug('done?', done);
  if( done ){
    args.hrtime = args.hrtime || process.hrtime();
    args.time = util.prettyTime(process.hrtime(args.hrtime));
    this.emit('done', argv, args, next);
  } else {  args.hrtime = process.hrtime();  }

  function next(_argv){
    if( _argv && cmd._depth ){
      self.emit('next', _argv);
    } else if( !done ){
      self.consumer(argv, args);
    }
    return _argv && cmd._depth || !done;
  }

  return this;
};

/*
 * doc holder
 */

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
Runtime.prototype.completer = function (line, callback){
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
