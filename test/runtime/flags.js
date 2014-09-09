
module.exports = function(runtime, testName){

  var rootNode = runtime.get();
  it('rootNode has flag as a child', function(){
    rootNode.children['--flag'].should.be.ok;
  });

  it('rootNode flag has handle', function(){

    rootNode.children['--flag'].handle.should.be
      .with.property('name', 'rootNodeFlag');
  });

  it('rootNode flag is in completion', function(){

    rootNode.completion.should.containDeep(
      ['--flag']
    );

  });

  it('1-nest has a flag as a child', function(){

    runtime.get('1-nest').children.should.have
      .property('--flag').and.be.ok;
  });

  it('1-nest flag has a handle', function(){

    runtime.get('1-nest --flag').should.have
      .property('handle').with.property('name', 'oneNestFlag');
  })

};
