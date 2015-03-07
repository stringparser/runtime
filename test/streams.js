'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function(runtime, util){
  var app = runtime.create('resolve', {log: false});

  before(function(done){
    app.set({onError: done});
    util.rimraf('dir', function(){
      util.mkdirp('dir/src', function(){
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

      var gulp = util.gulp;
      return gulp.src(src)
       .pipe(gulp.dest(destFolder))
       .on('error', next);
    }

    function end(){ fs.stat('dir/dest', done); }
    app.stack(src, end)('dir/src/*.js', 'dir/dest');
  });

  it('repl.input can be used to wait', function(done){
    app.set({onError: done});
    app.repl({input: util.through.obj()});

    function wait(next){
      next.wait = true;
      fs.createReadStream('./dir/src/file.js').pipe(app.repl.input);
      return app.repl.input;
    }

    function end(){ done(); }

    app.stack(wait, end)();
  });
};
