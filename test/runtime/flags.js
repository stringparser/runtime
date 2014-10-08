'use strict';

var should = require('should');

module.exports = function(runtime){

  var rootNode = runtime.get();
  it('rootNode has flag as a child', function(){
    should(rootNode.children['--flag'])
      .be.an.Object;
  });

  it('rootNode flag has handle', function(){

    rootNode.children['--flag'].handle
      .should.have.property('name', 'rootNodeFlag');
  });

  it('rootNode flag is in completion', function(){

    rootNode.completion.should
      .containDeep(['--flag']);

  });

  it('1-nest has a flag as a child', function(){

    should(runtime.get('1-nest').children['--flag'])
      .should.be.an.Object;
  });

  it('1-nest flag has a handle', function(){

    runtime.get('1-nest --flag').should.have
      .property('handle').with.property('name', 'oneNestFlag');
  });

};
