'use strict';

module.exports = function(runtime, util){
  var app = runtime.create({log: false});

  function createREPL(input, output){
    app.repl({
      input: input || util.through.obj(),
      output: output || util.through.obj()
    });
  }

  createREPL();

  it('should dispatch handlers on input', function(done){
    app.set(':handle', function(){ done(); });
    app.repl.input.write('handle\n');
  });

  it('should not dispatch handlers on emtpy input', function(done){

    var data = null;
    app.set(':handle', function(){
      data = true;
    });

    var writeStream = util.through.obj(
      function write(data, enc, cb){
        this.push(data.toString());
        cb();
      },
      function flush(cb){
        this.emit('end');
        cb();
      });

    writeStream.pipe(app.repl.input);

    var timer = null;
    var prompt = app.repl._prompt;
    app.repl.output.on('data', function(chunk){
      data = !!chunk.replace(prompt, '').trim();
      data.should.be.eql(false);
      clearTimeout(timer, 1); timer = setTimeout(done);
    });

    writeStream.write('\n\r');
  });

  it('should restore itself on close', function(){
    app.repl.close();
    app.repl.should.be.eql(runtime.Runtime.prototype.repl);
  });

};
