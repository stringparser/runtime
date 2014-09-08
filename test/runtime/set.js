

module.exports = function(runtime, testName){

  var rootNode = runtime.get();

  it('root has _name and props [children, completion, aliases]', function(){

    rootNode.should.be.an.Object;
    rootNode.should.have.property('_name', testName);
    rootNode.should.have.properties([
        'children', 'aliases', 'completion'
      ]);

  });

  it('No function is needed to set a command', function(){

    runtime.set('hello world').get('hello world')
      .should.be.and.Object;
  });


  it('If a command doesn\'t exist parent is created', function(){

    runtime.set('what up').get('what up').should.have
      .property('_depth').and.be.exactly(2);

    runtime.get('what').should.have
      .property('_name').and.be.exactly('what');

  });

  it('handle is added only to the last command', function(){

    runtime.get('1-nest').should.not
    .have.property('handle');

    runtime.get('1-nest 2-nest').should.not
      .have.property('handle');


    runtime.get('1-nest 2-nest 3-nest').handle.should.be
      .a.Function.with.property('name', 'threeNest');

    runtime.get('1-nest 2-nest 3-nest').handle.should.have
      .property('name', 'threeNest');
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

    var children = Object.keys(runtime.get().children);
     var aliases = Object.keys(runtime.get().aliases);

    runtime.get().completion.should.be
      .an.Array
      .and
      .containDeep(
        children.concat(aliases)
      );
  });

};
