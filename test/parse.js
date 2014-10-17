'use strict';

var should = require('should');

module.exports = function(pack, util){

  should.exists(util);
  var runtime = pack.create('testParse');

  it('should give a hook for to configure properties', function(){

    runtime.parse('myProp', function(node, opts, stems){
      var last = stems.slice(-1)[0];
      node.children[last].myProp = stems;
    });

    runtime.set('hello world what up', { myProp : true });
    runtime.set('not a thing');

    runtime.get('hello world what up').myProp
      .should
      .be.eql(['hello', 'world', 'what', 'up']);
  });

  it('should be possible to override what is there', function(){

    var handler = runtime.config('parse').handle;

    runtime.parse('handle', function(node, opts, stems){
      var last = stems.slice(-1)[0];
      var second = stems.slice(1,2);
      node.children[last].handle = function(){
        return second;
      };
    });

    runtime.set('hey yall you', function willNotWork(){});

    runtime.get('hey yall you').handle()
      .should.be.eql(['yall']);

    runtime.set('mmmmm bierrr', function willNotWork(){});

    runtime.get('mmmmm bierrr').handle()
      .should.be.eql(['bierrr']);

    // leave it as it was for next tests
    runtime.parse('handle', handler);
    runtime.set('hello there you jonki', function(){
      return 'allright';
    });
    runtime.get('hello there you jonki').handle()
      .should.be.eql('allright');
  });
};
