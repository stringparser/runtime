'use strict';

var runtime = require('./.').create('context', {
     input : process.stdin,
    output : process.stdout
  });

runtime.set('ctx', function(ctx){
  Object.keys(ctx).forEach(function(key){
    console.log(key, ctx[key]);
  });
});

runtime.set('pass', function(ctx, args, next){
  console.log('pass', arguments);
  next('args', ctx.argv, ctx.args, ctx.params);
});

runtime.set('args', function(ctx, args){
  console.log('passed args');
  args.forEach(function(arg){
    console.log(arg);
  });
});
