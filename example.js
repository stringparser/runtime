'use strict';

var gulp = require('gulp');
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

app.set(':handle', function command(next){
  var rtime = Math.random()*10;
  setTimeout(function(){
    next();
  }, rtime);
});

app.set(':src :dest', function task(next){
  var src = next.params.src;
  var dest = next.params.dest;
  return gulp.src(src)
        .pipe(gulp.dest(dest));
});

console.log(argv);
if(argv.length){ app.next(argv); }
