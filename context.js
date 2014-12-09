'use strict';

var runtime = require('./.').create('context', {
     input : process.stdin,
    output : process.stdout,
    completion : null
  });

runtime.set(function rootNode(next){
  console.log('ctx root');
  console.log(next);
  if(next.done){ runtime.prompt(); }
});

runtime.set('series', function series(next){
  next.async = true;
  console.log('starting series with %s', next.argv.slice(next.index));
  next();
});

runtime.set('parallel', function series(next){
  next.async = false;
  console.log('starting parallel with %s', next.argv.slice(next.index));
  next();
});

var series = ['one', 'two', 'three'];
series.forEach(function(name){
  runtime.set(name, function(next){
    var scope = next.clone(true);
    var rtime = Math.random()*1000;
    console.log('"%s" in %s with "%s" ',
      name, next.argv[0], next.argv.slice(next.index+1).join(', '));
    setTimeout(function(){
      console.log('`%s` done after %s (%s)', name, scope.time(), rtime);
      console.log(scope);
      next();
    }, rtime);
  });
});

runtime.set('get page.data /url', function(next){
  console.log(next);
});
