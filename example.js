'use strict';

var runtime = require('./.')
  .create('example')
  .setPrompt(' test > ')
  .prompt();

runtime.set(function(argv){
  if( !this.get(argv)._depth ){
    console.log(' command `%s` doesn\'t exists', argv.join(' '));
    this.prompt();
  }
});
