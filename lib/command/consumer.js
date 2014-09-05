/*
 * Module dependencies
 */
var host = require('../host');
var warning = require('./warning');

/*
 * Module dependencies
 */
module.exports = function defaultConsumer(argv, args, cmd){

  var root = this.get();
  cmd = cmd || this.get(argv);

  if(cmd.handle){

    var scope  = this.config('scope');
    cmd.handle.call(
      scope ? require(scope) : this, argv, args
    );

    // ""ñam, ñam, ñam..." consume the arguments
    argv = consume(argv, cmd.completion);

    if(argv[0]){
      argv = consume(argv, root.completion);
    }
  }

  if( cmd.completion && cmd.completion.indexOf(argv[0]) > 0 ){

    host.getInterface().emit('next',
      argv, args, this.get(argv)
    );
  }
  else if( argv[0] && argv[0][0] !== '-' ){

    warning(' command `'+argv[0]+'` not found');
    this.prompt();
  }
};

/*
 * doc holder
 */
function consume(argv, completion){

  return argv.filter(function(arg){
    if( completion && arg[0] !== '-' ){
      return completion.indexOf(arg) === -1;
    } else {
      return true;
    }
  });
}
