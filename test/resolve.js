'use strict';

var fs = require('fs');
var cp = require('child_process');
var path = require('path');
var gulp = require('gulp');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var should = require('should');

module.exports = function(runtime){
  should.exists(runtime);
  var app = runtime.create('resolve', {log: false});

  before(function(done){
    rimraf('dir', function(){
      mkdirp('dir/src', function(){
        fs.open('dir/src/file.js', 'w', done);
      });
    });
  });

  it('can wait to gulp streams', function(done){
    app.set({error: done});

    function src(next, src, dest){
      next.wait = true;
      return gulp.src(src)
       .pipe(gulp.dest(function(){
         return path.resolve(__dirname, dest);
       }));
    }

    function end(){
      fs.stat('dir/dest', done);
    }
    app.stack(src, end)('dir/src/*.js', 'dir/dest');
  });

  it('can wait to child processes', function(done){
    app.set({error: done});

    function ls(next){
      next.wait = true;
      var dirls = '', pc = cp.spawn('ls', ['dir']);
      pc.stdout.on('data', function(chunk){
        dirls += chunk.toString();
      });
      pc.stdout.once('end', function(){
        next(null, dirls);
      });
      return pc.stdout;
    }

    function end(next, dirls){
      dirls.should.be.eql('dest\nsrc\n');
      done();
    }

    app.stack(ls, end)();
  });
};
