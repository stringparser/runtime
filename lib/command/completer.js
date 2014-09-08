/*
 *
 */
var finder = require('findit')('.');
var pathCompletion = [];
finder.on('path', function(file, stat){

  var test = (/^.git|node_modules|^\./i).test(file);
      test = !test && (/(\.(js|coffee)$)/i).test(file);

  if( test ){
    pathCompletion.push(file);
  }
});

module.exports = function defaultCompleter(line){

  var hits, argv = this.lexer(line);
  var completion = this.get(argv).completion;
      completion = completion.concat(pathCompletion);

  if(completion)
    hits = completion.filter(function(c){
      return c.indexOf(line) === 0;
    });

  return [ hits[0] ? hits : completion, line];
};
