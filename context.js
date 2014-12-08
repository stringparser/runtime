'use strict';

var runtime = require('./.').create('context', {
     input : process.stdin,
    output : process.stdout,
    completion : null
  });

runtime.set(function rootNode(){
  console.log('ctx root', this);
  if(this.done){ runtime.prompt(); }
});

runtime.set('series', function series(){
  var ctx = this; ctx.async = true;
  console.log('starting series with %s', ctx.argv.slice(ctx.index+1));
  ctx.next();
});

runtime.set('parallel', function series(){
  var ctx = this; ctx.async = false;
  console.log('starting parallel with %s', ctx.argv.slice(ctx.index+1));
  ctx.next();
});

var series = ['one', 'two', 'three'];
series.forEach(function(name){
  runtime.set(name, function(){
    var ctx = this;
    var rtime = 100;
    console.log('"%s" in %s with "%s" ',
      name, ctx.argv[0], ctx.argv.slice(ctx.index+1).join(', '));
    setTimeout(function(){
      console.log('`%s` done after %s ms', name, rtime);
      ctx.next();
    }, rtime);
  });
});
