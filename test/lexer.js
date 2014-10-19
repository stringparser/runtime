'use strict';

var should = require('should');

module.exports = function(pack, util){
  should.exists(util);
  var runtime = pack.create('lexer');

  it('should strip any number', function(){
    var line = 'foo 3 bar 4 -x 3 -y 4 -abc --beep=10';
    var lexed = runtime.lexer(line);
    lexed.should
      .be.eql('foo bar -x -y -abc --beep'.split(/[ ]+/));
  });

  it('should be strip parameters from flags', function(){
    var line = '--abc=cdh --beep=boop';
    var lexed = runtime.lexer(line);
    lexed.should
      .be.eql('--abc --beep'.split(/[ ]+/));
  });

  it('should also strip them even if are next to the flag', function(){
    var line = '-n5 -abc0 foot 3';
    var lexed = runtime.lexer(line);
    lexed.should
      .be.eql('-n -abc foot'.split(/[ ]+/));
  });
};
