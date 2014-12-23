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
  console.log('\nStarting <%s> in series', next.argv.slice(next.index).join(', '));
  next.wait = true; next();
  if(next.done){ next.time(next.argv.slice(0, next.index-next.done).join(' ')); return console.log(next); }
  next.argv.push('series');
});

app.set('parallel', function parallel(next){
  next.wait = false;
  console.log('\nStarting <%s> in parallel', next.argv.slice(next.index).join(', '));
  next.argv.push('parallel');
  next();
});

app.set(':name(\\w+)', function(next){
  var self = this;
  var name = this.params.name;
  process.nextTick(function(){
    console.log('`%s` done after %s', name, next.time(self.path));
    console.log(next);
    next();
  });
});

console.log(argv);
if(argv.length){ app.next(argv)(); }
