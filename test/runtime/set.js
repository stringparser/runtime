

var assert = require('assert');

module.exports = function(runtime, testName){

  var rootCMD = runtime.get();
  var child = runtime.get().children;
  var aliases = Object.keys(rootCMD.aliases);

  it('rootCMD is object, has proper name, props: children, completion and aliases', function(){
    assert( typeof rootCMD === 'object' );
    assert( rootCMD._name ===  testName );
    assert( rootCMD.children );
    assert( rootCMD.aliases );
    assert( rootCMD.completion );
  });

  // console.log('rootCMD = \n', rootCMD);
  // console.log('children = \n', child);

  it('{ nested : false } unests forever?', function(){
    assert(
      child['1']._name === '1' &&
      child['2']._parent === rootCMD._name &&
      child['3']._parent === rootCMD._name &&
      child['4']._depth === 1  &&
      child['1-nest']._parent === testName
    );
  });

  it('{ nested : true } always nest?', function(){

    var anchor = rootCMD.children;

    var index = 0;
    while(anchor.completion){

      assert(anchor.completion.length === 1);
      assert(anchor._depth === index);

      anchor = anchor.children;
      index++;
    }

  });

  describe('- Aliases', function(){

    it('Only 1st alias in rootCMD.children?', function(){

      assert(
        aliases.filter(function(alias){
          return rootCMD.children[alias];
        }).length === 0
      );

      assert( rootCMD.children['1-alias'] );

    });

    it('All aliases point to the first?', function(){

      assert(
        aliases.filter(function(alias){
          return rootCMD.aliases[alias] === '1-alias';
        }).length === aliases.length
      );
    });

    it('All aliases in completion?', function(){

      assert(
        aliases.filter(function(name){
          return rootCMD.completion.indexOf(name) !== -1;
        }).length === aliases.length
      );

    });
  });
}
