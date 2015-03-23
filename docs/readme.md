##### Getting started - [`module.exports`][t-module] - [Runtime API][t-runtime-api] - [Stack API][t-stack-api]

The simplest way to start is to see some code, or better play with it. I'll leave here some snippets. Feel free to [come and chat](https://gitter.im/stringparser/gulp-runtime). If I'm around and have time I wouldn't mind at all.

##### stacking functions

The simplest example is to run some functions and see what happens.

```js
var app = require('runtime').create();

function foo(next){
  setTimeout(next, Math.random()*10);
}

function bar(next){
  setTimeout(next, Math.random()*10);
}

function baz(next){
  setTimeout(next, Math.random()*10);
}

var tick = app.stack(foo, bar, baz);
var tack = app.stack(foo, bar, baz, tick, {wait: true});
var teck = app.stack(foo, app.stack(teck));
```

#### CRUD file

Lets do now something more interesting.

1. Create a directory (wipe it first if was there so watch out)
1. Write a count from 0 to 5 in it
1. Ask user for removal afterwards
1. And when its done print a goodbye message

```js
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var app = require('runtime').create('writePipeRemove').repl();

process.chdir(__dirname);

function wipe(next, dirname){
  return cp.spawn('rm', ['-rf', dirname]);
}

function create(next, dirname){
  fs.mkdir(dirname, next);
}

function write(next, dirname, filename){
  next(null, dirname, fs.createWriteStream(path.join(dirname, filename)));
}

function update(next, dirname, stream){
  var count = 0;
  setInterval(function(){
    stream.write(++count + '\n');
    if(count > 5){
      stream.end();
      clearInterval(this);
    }
  });
  return stream;
}

function remove(next, dirname, stream){
  var question = 'Ok! file is in `'+ stream.path + '`';
  app.repl.question(question + 'remove directory? (Y/N) ', function(answer){
    if(/^Y/i.test(answer)){
      next(null, cp.spawn('rm', ['-rf', dirname]));
    } else {
      console.log('Leaving the directory there then.');
      next(null, null);
    }
  });
}

function bye(next, rm){
  var message = 'you take care ha?';

  if(rm){
    rm.stdin.once('end', function(){
      app.repl.close();
    });
  }

  app.repl.once('close', function(){
    console.log(message);
  });

  app.repl.close();
}

app.stack(wipe, create, write, update, remove, bye, {
  wait: true,
  onHandleError: function(err){
    console.log('ups, there was an error');
    throw err;
  }
})('dirname', 'fileName');
```


<!--
  x-: is for just a link
  t-: is for doc's toc
-->

[t-docs]: http://github.com/stringparser/runtime/tree/master/docs

[t-module]: http://github.com/stringparser/runtime/tree/master/docs/api/readme.md

[t-stack-api]: http://github.com/stringparser/runtime/tree/master/docs/api/stack.md

[t-runtime-api]: http://github.com/stringparser/runtime/tree/master/docs/api/runtime.md

[x-completer]: http://github.com/stringparser/runtime/tree/master/lib/completer.js
