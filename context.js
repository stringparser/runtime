'use strict';

var runtime = require('./.').create('context').repl({
     input : process.stdin,
    output : process.stdout,
    completion : null
  });

runtime.set(function rootNode(next){
  this.mode = 'parallel';
  if(next.done){ runtime.prompt(); }
});

runtime.set('series', function series(next){
  next.async = true;
  this.mode = 'series';
  console.log('\nStarting <%s> with %s',
    this.mode, next.argv.slice(next.index));
  next();
});

runtime.set('parallel', function parallel(next){
  next.async = false;
  this.mode = 'parallel';
  console.log('\nStarting <%s> with %s',
    this.mode, next.argv.slice(next.index));
  next();
});

runtime.set(':name(\\w+)', function(next){
  console.log('from "%s"', next.argv[next.index-1]);
  var ctx = next.clone();
  var rtime = Math.random()*1000;
  setTimeout(function(){
    console.log('`%s` done after %s (%s)', ctx.params.name, ctx.time(), rtime);
    console.log(ctx); console.log(next);
    next();
  }, rtime);
});


runtime.set('get page.data /url', function(next){
  console.log(next);
});
