'use strict';

/**
 * Module dependencies
 */
var debug = require('debug')('cmd:consumer');

/*
 * Module dependencies
 */
module.exports = function defaultConsumer(argv, args, cmd){

  cmd = cmd || this.get(argv);

  var scope = this.config('scope');
  var anchor = this.get(cmd._parent);

  debug('  cmd', cmd);
  debug(' argv', argv);
  debug('scope', scope);
  debug('anchor', anchor);

  if( cmd.handle ){

    cmd.handle.call(scope ? require(scope) : this, argv, args);
    argv = consume(
      consume(argv, cmd.completion), anchor.completion
    );
    debug('consumed arguments', argv);

  } else {
    argv = [ ];
  }

  // if(argv[0])
  //   host.getInterface().emit('next',
  //     argv, args, this.get(argv)
  //   );

};

/*
 * doc holder
 */
function consume(argv, completion){

  if( completion ){
    return argv.filter(function(arg){
      return completion.indexOf(arg) === -1;
    });
  } else {
    return argv[0] ? argv : [ ];
  }
}
