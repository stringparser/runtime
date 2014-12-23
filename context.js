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
  console.log('\nStarting <%s> in series', next.argv.slice(next.index));
  next.series = true; next();
});

runtime.set('parallel', function parallel(next){
  console.log('\nStarting <%s> in parallel', next.argv.slice(next.index));
  next.series = false; next();
});

runtime.set(':name(\\w+)', function(next){
  var ctx = next.clone();
  var name = next.params.name;
  var rtime = Math.random()*1000;
  setTimeout(function(){
    console.log('`%s` done after %s (%s)', name, ctx.time(), rtime);
    next();
  }, rtime);
});


runtime.set('get page.data /url', function(next){
  console.log(next);
});
