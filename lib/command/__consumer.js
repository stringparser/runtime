
var Warning = require('./warning');
var xInterface = require('./interface');

module.exports = function defaultConsumer(command, argv, args){

  console.log('\n Consumers says: "ñam, ñam, ñam! ... "\n  ')
  console.log('\n   argv = ', argv, '\n')
  console.log('  chewing = \n',command);

  argv = argv.slice(command._depth);

  console.log('\n followUp = \n', this.get(argv));
  console.log('\n argv = ', argv, '\n');

  if(this.get(argv)._name === argv[0]){

    xInterface.getInterface().emit('next', argv, args);

  }
  else if ( argv[0] ){

    Warning(' command `'+argv[0]+'` not found');
    xInterface.getInterface().emit('done', argv, args);
  }
  else
    xInterface.getInterface().emit('done', argv, args);

}