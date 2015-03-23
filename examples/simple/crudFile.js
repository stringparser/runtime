'use strict';

var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var app = require('../../.').create('writePipeRemove').repl();

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
