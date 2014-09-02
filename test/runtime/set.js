

var assert = require('assert');

module.exports = function(runtime, testName){

  var rootCMD = runtime.get();
  var child = runtime.get().children;
  var aliases = Object.keys(rootCMD.aliases);

  it('root has props [name, children, completion, aliases]', function(){
    assert( typeof rootCMD === 'object' );
    assert( rootCMD._name ===  testName );
    assert( rootCMD.children );
    assert( rootCMD.aliases );
    assert( rootCMD.completion );
  });

  it('No function is needed to set a command', function(){

    runtime
      .set('hello world')
      .get('hello world')
      .should.not.be.an.Error.instance;

  });

  it('Completion is already filled', function(){

    runtime
      .get(['hello'])
      .completion.should.be.an.Array.and.containDeep(['world']);
  });

  it('If a command doesn\'t exist parent is created', function(){

    runtime
      .set('what up')
      .get(['what', 'up'])
      .should.have.property('_depth').and.be.exactly(2);

  })

}
