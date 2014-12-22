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
  console.log('from %s', next.argv[next.index-1]);
  console.log(arguments);
  var ctx = next.clone();
  var par = ctx.params;
  var rtime = Math.random()*1000;
  var pending = next.argv.slice(next.index+1).join(', ');
  console.log('`%s` in <%s> with `%s`', par.name,
    this.mode || 'parallel', pending);
  setTimeout(function(){
    console.log('`%s` done after %s (%s)', par.name, ctx.time(), rtime);
    console.log();
    next();
  }, rtime);
});


runtime.set('get page.data /url', function(next){
  console.log(next);
});
