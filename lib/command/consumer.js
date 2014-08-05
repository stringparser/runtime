/*
 * Module dependencies
 */
var Warning = require('./warning');
var terminal = require('./terminal');

module.exports = function defaultConsumer(argv, args, command){

  var command = command || this.get(argv);

  var nextFired = false;
  if(command.handle){
    command.handle(argv, args, function(){
      nextFired = true;
    });
    argv = argv.slice(command._depth);
  }

/*  console.log('\n Consumers says: "ñam, ñam, ñam! ... "')
  console.log('\n   argv = ', argv, '\n')
  console.log('  chewing = \n',command);*/

  var xInterface = terminal.getInterface();
  var command = this.get(argv);

  if(argv[0] && command._parent !== command._name){

/*    console.log('\n followUp = \n', this.get(argv));
    console.log('\n argv = ', argv, '\n');*/

    xInterface.emit('next', argv, args, command);

  }
  else if ( argv[0] ){

    Warning(' command `'+argv[0]+'` not found');
    xInterface.emit('done', argv, args);
  }
  else {
    xInterface.emit('done', argv, args);
  }
}