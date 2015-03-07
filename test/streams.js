'use strict';

var fs = require('fs');
var cp = require('child_process');
var path = require('path');
var gulp = require('gulp');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var should = require('should');
var through = require('through2');

module.exports = function(runtime){
  should.exists(runtime);
  var app = runtime.create('resolve', {log: false});

  before(function(done){
    app.set({onError: done});
    rimraf('dir', function(){
      mkdirp('dir/src', function(){
        fs.open('dir/src/file.js', 'w', done);
      });
    });
  });

  it('can wait to gulp streams', function(done){
    app.set({onError: done});

    function src(next, src, dest){
      next.wait = true;
      function destFolder(){
        return path.resolve(__dirname, dest);
      }

      return gulp.src(src)
       .pipe(gulp.dest(destFolder))
       .on('error', next);
    }

    function end(){ fs.stat('dir/dest', done); }    
    app.stack(src, end)('dir/src/*.js', 'dir/dest');
  });

  it('repl.input can be used to wait', function(done){
    app.set({onError: done});
    app.repl({input: through.obj()});

    function wait(next){
      next.wait = true;
      fs.createReadStream('./dir/src/file.js').pipe(app.repl.input);
      return app.repl.input;
    }

    function end(){ done(); }

    app.stack(wait, end)();
  });
};
