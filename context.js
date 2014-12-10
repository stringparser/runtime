'use strict';

var runtime = require('./.').create('context', {
     input : process.stdin,
    output : process.stdout,
    completion : null
  });

runtime.set(function rootNode(err, next){
  console.log(next);
  this.mode = 'parllel';
  if(next.done){ runtime.prompt(); }
});

runtime.set('series', function series(err, next){
  next.wait = true;
  this.mode = 'series';
  console.log('\nStarting <%s> with %s',
    this.mode, next.argv.slice(next.index));
  next();
});

runtime.set('parallel', function parallel(err, next){
  next.wait = false;
  this.mode = 'parallel';
  console.log('\nStarting <%s> with %s',
    this.mode, next.argv.slice(next.index));
  next();
});

var series = ['one', 'two', 'three'];
series.forEach(function(name){
  runtime.set(name, function(err, next){
    var scope = next.clone(true);
    var rtime = Math.random()*1000;
    var pending = next.argv.slice(next.index+1).join(', ');
    console.log('`%s` in <%s> with `%s`',
      name, this.mode || 'parallel', pending);
    setTimeout(function(){
      console.log('`%s` done after %s (%s)', name, scope.time(), rtime);
      console.log(scope);
      console.log();
      next();
    }, rtime);
  });
});

runtime.set('get page.data /url', function(next){
  console.log(next);
});
