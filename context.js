'use strict';

var runtime = require('./.').create('context', {
     input : process.stdin,
    output : process.stdout
  });

runtime.set('hello', function(){
  [].slice.call(arguments).forEach(function(arg){
    console.log(arg);
  });
});

runtime.set('pass', function(ctx, args, next){
  next('args', ctx.argv, ctx.args, ctx.params);
});

runtime.set('args', function(ctx, args){
  console.log('passed args');
  args.forEach(function(arg){
    console.log(arg);
  });
});
