/*
 * Module dependency
 */

var finder = require('findit')('.');
var host = require('../host');

/*
 * Using `findit` to get
 */
var pathCompletion = [];
finder.on('path', function(file, stat){

  var test = (/^.git|node_modules|^\./i).test(file);
      test = !test && (/(\.(js|coffee)$)/i).test(file);

  if( test ){
    pathCompletion.push(file);
  }
});

module.exports = function defaultCompleter(line){

  var last = line.split(/[ ]+/).pop();
  var hits = this.lexer(last);
  var completion = this.get().completion || [];

  (this.get(last).completion || []).forEach(function(elem){
    if(completion.indexOf(elem) < 0)
      completion.push(elem);
  });

  if(completion)
    hits = completion.filter(function(c){
      return c.indexOf(last) === 0;
    });

  return [ hits[0] ? hits : completion, line];
};
