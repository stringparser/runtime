
'use strict';

var should = require('should');

module.exports = function(runtime, testName){

  it('root has _name and props [children, completion, aliases]', function(){

    runtime.get().should
      .have.property('_name', testName);

    runtime.get().should
      .have.properties([
        'children', 'completion'
      ]);

  });

  it('No function is needed to set a command', function(){

    should.exists(runtime.set('hello world').get('hello world'))

  });


  it('If a command doesn\'t exist parent is created', function(){

    runtime.set('what up').get('what up').should.have
      .property('_depth').and.be.exactly(2);

    runtime.get('what').should.have
      .property('_name').and.be.exactly('what');

  });

  it('handle is added only to the last command', function(){

    should(runtime.get('1-nest'))
      .be.an.Object
      .and.not
      .have.property('handle');

    should(runtime.get('1-nest 2-nest'))
      .be.an.Object
      .and.not
      .have.property('handle');

    should(runtime.get('1-nest 2-nest 3-nest'))
      .be.an.Object
      .and
      .have.property('handle');
  });

  it('Completion is on the parent node', function(){

    runtime.get().completion.should.be
      .an.Array.and
      .containDeep(['1-nest']);

    runtime.get().completion.should.not
      .containDeep(['2-nest'])
      .and.not
      .containDeep(['3-nest']);
  });

  it('Completion has children and aliases', function(){

    runtime.get().completion.should
      .containDeep(
        Object.keys(runtime.get().children)
      );

    runtime.get().completion
      .should
      .have.lengthOf(
        Object.keys(runtime.get().children).length +
        Object.keys(runtime.get().aliases).length
      ).exactly;

  });

};
