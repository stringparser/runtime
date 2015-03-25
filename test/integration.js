'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function(runtime, util){
  var app = runtime.create({log: false});

  before(function(done){
    app.set({onHandleError: done});
    util.rimraf('dir', function(){
      util.mkdirp('dir/src', function(){
        fs.open('dir/src/file.js', 'w', done);
      });
    });
  });

  it('async-done enables waiting to gulp streams', function(done){
    app.set({onHandleError: done});

    function src(next, src, dest){
      next.wait = true;
      function destFolder(){
        return path.resolve(__dirname, dest);
      }

      return util.gulp.src(src)
       .pipe(util.gulp.dest(destFolder))
       .on('error', next);
    }

    function end(){ fs.stat('dir/dest', done); }
    app.stack(src, end)('dir/src/*.js', 'dir/dest');
  });

  it('async-done enables waiting to through streams', function(done){
    app.set({onHandleError: done});
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
