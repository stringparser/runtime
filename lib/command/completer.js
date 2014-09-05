/*
 *
 */

module.exports = function defaultCompleter(line){

  var argv = this.lexer(line);
  var completion = this.get(argv).completion;

  if(completion)
    var hits = completion.filter(function(c){
      return c.indexOf(line) === 0;
    });

  return [ hits[0] ? hits : completion, line];
};
