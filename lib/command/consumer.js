/*
 * Module dependencies
 */
var host = require('../host');
var debug = require('debug')('cmd:consumer');

/*
 * Module dependencies
 */
module.exports = function defaultConsumer(argv, args, cmd){

  var scope = this.config('scope');
       cmd = cmd || this.get(argv);
  var anchor = this.get(cmd._parent);

  if( cmd.handle ){

    debug('  cmd', cmd);
    debug(' argv', argv);
    debug('scope', scope);
    debug('anchor', anchor);

    cmd.handle.call(scope ? require(scope) : this, argv, args);

    argv = consume(
      consume(argv, cmd.completion), anchor.completion);

    debug('consumed arguments', argv);
  }

  if(argv[0])
    host.getInterface().emit('next',
      argv, args, this.get(argv)
    );

};

/*
 * doc holder
 */
function consume(argv, completion){

  if( completion )
    return argv.filter(function(arg){
      if( completion && arg[0] !== '-' ){
        return completion.indexOf(arg) === -1;
      } else {
        return true;
      }
    });
  else
    return argv;
}
