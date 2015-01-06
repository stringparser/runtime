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
  next.wait = true; next();
  console.log('\nStarting <%s> in series', pending);
});

app.set('parallel', function parallel(next){
  var pending = next.argv.slice(next.index).join(', ');
  next.wait = false; next();
  console.log('\nStarting <%s> in parallel', pending);
});

app.set(':name([a-z]+)', function(next){
  var rtime = Math.random()*100;
  setTimeout(function(){
    console.log('[real] >%s< in %s', next.found, rtime);
    next();
  }, rtime);
});

app.set(':task(\\d+)', function(next){
  var rtime = Math.random()*100;
  setTimeout(function(){
    next();
    console.log('[real] >%s< in %s', next.found, rtime);
  }, rtime);
});

console.log(argv);
if(argv.length){ app.next(argv); }
