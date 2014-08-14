
var herro = require('herro');

var assert = require('assert');

var testName = 'test.command';

var runtime = (
  new require('../lib/runtime')
).createInterface(testName);

runtime({ nested : false })
  .set('1', function(){ return this })
  .set('2', function(){ return this.get('2'); })
  .set('3', function(){ return this.get('3'); })
  .set('4', function(){ return this.get('4'); })

runtime({ nested : true })
  .set('1-nest', function(){ return this.get('1-nest'); })
  .set('2-nest', function(){ return this.get('2-nest'); })
  .set('3-nest', function(){ return this.get('3-nest'); })
  .set('4-nest', function(){ return this.get('4-nest'); })

runtime
  .set(['1-alias', '2-alias', '3-alias', '4-alias'], function(){ return this.get('1-alias'); })

var root = runtime.get();
var child = root.children;


var completion = Object.keys(root.children);
var aliases = Object.keys(root.aliases);

describe('Runtime.Command', function(){

  //
  // runtime#get
  //
  describe('#set', function(){

    it('root is object, has proper name, props: children, completion and aliases', function(){
      assert( typeof root === 'object' );
      assert( root._name ===  testName );
      assert( root.children );
      assert( root.aliases );
      assert( root.completion );
    })

    it('{ nested : false } unests forever?', function(){
      assert(
           child['1']._name === '1'
        && child['2']._parent === root._name
        && child['3']._parent === root._name
        && child['4']._depth === 1
        && child['1-nest']._parent === testName
      );
    })

    it('{ nested : true  } always nest?', function(){

      var anchor = root.children;

      var index = 0;
      while(anchor.completion){

        assert(anchor.completion.length === 1)
        assert(anchor._depth === index);

        anchor = anchor.children;
        index++;
      }

    })

    describe('- Aliases', function(){

      it('Only 1st alias in root.children?', function(){

        assert(
          aliases.filter(function(alias){
            return root.children[alias]
          }).length === 0
        )

        assert( root.children['1-alias'] )

      })

      it('All aliases point to the first?', function(){

        assert(
          aliases.filter(function(alias){
            return root.aliases[alias] === '1-alias'
          }).length === aliases.length
        )
      })

      it('All aliases in completion?', function(){

        assert(
          aliases.filter(function(name){
            return root.completion.indexOf(name) !== -1;
          }).length === aliases.length
        )

      })
    })

  })

  //
  // runtime#get
  //
  describe('#get', function(){

    it('runtime.get()._depth === 0?', function(){
      assert( runtime.get()._depth === 0 );
    })

    it('runtime.get( "1-nest", "2-nest", "3-nest")._depth === 3?', function(){
      assert( runtime.get("1-nest","2-nest", "3-nest")._depth === 3 );
    })

    it('runtime.get(["1-nest", "2-nest", "3-nest"])._depth === 3?', function(){
      assert( runtime.get(["1-nest","2-nest", "3-nest"])._depth === 3 );
    })

    describe('- Aliases', function(){
      it('runtime.get("1-alias")._name === runtime.get("2-alias")._name?', function(){
        assert(
          runtime.get("1-alias")._name === runtime.get("2-alias")._name
        );
      })
    })

    describe('- Not supported arguments', function(){

    })

  })

  //
  // runtime#get
  //
  describe('#handle', function(){

    it('!runtime.get().handle', function(){
      assert( !runtime.get().handle );
    })

    it('runtime.get("1").handle()._name === runtime.get("1")._name', function(){
      assert( runtime.get("1").handle()._name === runtime.get("1")._name );
    })

  })

  describe('#completion', function(){

    describe('- Not supported arguments', function(){

      it('number', function(){

        var err;
        try      {  runtime.completion(1);  }
        catch(e) { err = e; }
        assert( err instanceof Error );

      })

      it('string', function(){

        var err;
        try      {  runtime.completion("1");  }
        catch(e) { err = e; }
        assert( err instanceof Error );

      })

      it('array has any non-string content', function(){

        var err;
        try      {  runtime.completion(["1","2",3, "4"]);  }
        catch(e) { err = e; }
        assert( err instanceof Error );

      })

      it('object', function(){

        var err;
        try      {  runtime.completion({ one : 1});  }
        catch(e) { err = e; }
        assert( err instanceof Error );

      })

      it('function not returning array', function(){

        var err;
        try      {  runtime.completion(function(){ return 1; });  }
        catch(e) { err = e; }
        assert( err instanceof Error );

      })

      it('function returning array with any non-string content', function(){

        var err;
        try      {  runtime.completion(function(){ return ["1","2",3]; });  }
        catch(e) { err = e; }
        assert( err instanceof Error );

      })

    })

  })

})

process.stdin.end();