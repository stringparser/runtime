
var assert = require('assert');

module.exports = function(runtime, testName){

  var root = runtime.get();
  var child = root.children;
  var completion = Object.keys(root.children);
  var aliases = Object.keys(root.aliases);

  describe('- Not supported arguments', function(){

      it('number', function(){

        var err;
        try      {  runtime.completion(1);  }
        catch(e) { err = e; }
        assert( err instanceof Error );

      });

      it('string', function(){

        var err;
        try      {  runtime.completion("1");  }
        catch(e) { err = e; }
        assert( err instanceof Error );

      });

      it('array has any non-string content', function(){

        var err;
        try      {  runtime.completion(["1","2",3, "4"]);  }
        catch(e) { err = e; }
        assert( err instanceof Error );

      });

      it('object', function(){

        var err;
        try      {  runtime.completion({ one : 1});  }
        catch(e) { err = e; }
        assert( err instanceof Error );

      });

      it('function not returning array', function(){

        var err;
        try      {  runtime.completion(function(){ return 1; });  }
        catch(e) { err = e; }
        assert( err instanceof Error );

      });

      it('function returning array with any non-string content', function(){

        var err;
        try      {  runtime.completion(function(){ return ["1","2",3]; });  }
        catch(e) { err = e; }
        assert( err instanceof Error );

      });

    });
};
