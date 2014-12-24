'use strict';
var argv = process.argv.slice(2);
var app = require('./.').create('context').repl({
     input : process.stdin,
    output : process.stdout,
    completion : null
  });

app.set(function rootNode(next){
  if(next.done){ app.prompt(); }
});

app.set('#report', function(next){
  var ctx = this;
  console.log(ctx);
  console.log(next);
});

app.set('series', function series(next){
  var pending = next.argv.slice(next.index).join(', ');
  console.log('\nStarting <%s> in series', pending);
  next.wait = true; next();
  next.argv.push('series');
});

app.set('parallel', function parallel(next){
  next.wait = false;
  var pending = next.argv.slice(next.index).join(', ');
  console.log('\nStarting <%s> in parallel', pending);
  next.argv.push('parallel');
  next();
});

app.set(':name(\\w+)', function(next){
  var name = this.params.name;
  var rtime = Math.random()*100;
  setTimeout(function(){
    console.log('`%s` done after (%s ms)', name, Math.floor(rtime));
    console.log(next);
    next();
  }, rtime);
});

console.log(argv);
if(argv.length){ app.next(argv)(); }
