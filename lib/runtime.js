'use strict';

/*
 * Module dependencies
 */
var util = require('./utils');
var host = util.requirem('./host');
var Command = require('./command');

// var debug = util.debug(__filename);

exports = module.exports = {
      get : get,
   create : create,
  Runtime : Runtime,
  Command : Command
};

/**
 * doc holder
 */
var warehouse = { };
function create(name, config){
  name = util.type(name).string || '#root';
  return (warehouse[name] = new Runtime(name, config));
}

/**
 * doc holder
 */

function get(name, opts){
  return warehouse[name] || create(name, opts);
}

/**
 * doc holder
 */

function Runtime(name, options){

  if( !(this instanceof Runtime) ){
    return new Runtime(name, options);
  }

  var opts = util.type(options).plainObject || { };
  if(opts.input){ host.readline(this, opts); }

  util.merge(this, new Command(opts));
}
util.inherits(Runtime, Command);

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
 * ## Runtime.next
 * > dispatch next command line to run
 *
 * Each command line creates a new context
 * and a next callback
 *
 * returns this.next(ctx, args, next)
 */


Runtime.prototype.next = function(/* arguments */){
  var self = this, ctx, line = arguments[0];

  ctx = { // new context for each command
     index : 0,
      argv : this.lexer(line),
      args : util.args(arguments, {index : 1}).concat(next),
    params : this.parser(line),
       cmd : this.get(line)
  };

  function next(stem){
    if(util.type(stem).string){ // spin another
      self.next.apply(self, arguments);
      return ctx;
    } else if(ctx.cmd.done){ return ctx; }

    // same command with new arguments
    if(arguments.length){
      ctx.args = util.args(arguments).concat(next);
    }

    // continue to the next command
    while(ctx.argv[ctx.index] && !ctx.cmd._depth){
      ctx.index += (ctx.cmd._depth || 1);
      ctx.cmd = self.get(ctx.argv.slice(ctx.index));
    }

    ctx.cmd.handle = ctx.cmd.handle || self.get().handle;
    ctx.cmd.done = !Boolean(ctx.argv.length - ctx.index);
    ctx.cmd.sync = Boolean(ctx.cmd.handle.length - ctx.args.length);

    ctx.cmd.handle.apply(ctx, ctx.args);
    if(ctx.cmd.sync){ next(); }
    return ctx;
  }

  next(); // first dispatch
  line = null; // wipe
  return this;
};

/**
 * completer
 */
