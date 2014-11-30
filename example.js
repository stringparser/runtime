'use strict';

var runtime = require('./.')
  .create('example', { input: process.stdin, output: process.stdout })
  .setPrompt(' test > ')
  .prompt();

runtime.set(function(err, next){
  if(err){ throw err; }
  var ctx = this;
  console.log(ctx);
  console.log(arguments);
  console.log('command "%s"', ctx.argv.join(' '), 'not found');
  next();
});
