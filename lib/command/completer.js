

module.exports = function defaultCompleter(line){

  console.log(line)
  var completion = ['test1', 'test2', 'test3'];

  var hits = completion.filter(function(c){
    return c.indexOf(line);
  })

  return [ hits[0] ? hits : completion, line];
}