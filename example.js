'use strict';
var argv = process.argv.slice(2);
var app = require('./.').create('context').repl({
  input : process.stdin,
  output : process.stdout,
  completion : null
});

app.set(function rootNode(next){
  if(next.done){ console.log('done!'); console.log(next); }
});

app.set('series', function series(next){
  var pending = next.argv.slice(next.index).join(', ');
  console.log('\nStarting <%s> in series', pending);
  next.wait = true; next();
});

app.set('parallel', function parallel(next){
  var pending = next.argv.slice(next.index).join(', ');
  console.log('\nStarting <%s> in parallel', pending);
  next.wait = false; next();
});

app.set(':name(\\w+)', function(next){
  var rtime = Math.random()*100;
  setTimeout(function(){
    console.log('[done] >%s< in %s', next.found, rtime);
    next();
  }, rtime);
});

console.log(argv);
if(argv.length){ app.next(argv); }
