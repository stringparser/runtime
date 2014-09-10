/*
 * Module dependency
 */
var lebug = require('debug')('cmd:completer');
var debug = require('../utils').debug(lebug);

var finder = require('findit')('.');
var host = require('../host');

module.exports = function defaultCompleter(line){

  var prev = this.lexer(line);
  var complete = completion.slice();

  if(prev[1])
    line = line.substring(line.indexOf(prev.pop()));

  debug('\n');
  debug('prev = ', prev);
  debug('line = ', line);
  debug('completion = ', complete);

  (
    this.get(line).completion || [ ]
  ).forEach(function(elem){
    if(complete.indexOf(elem) < 0)
      complete.push(elem);
  });

  hits = complete.filter(function(c){
    return c.indexOf(line) === 0;
  });

  if( !hits[0] ){
    prev.forEach(function(elem){
      var index = complete.indexOf(elem);
      if( index > -1 )
        complete.splice(index, 1);
    });
  }

  return [ hits[0] ? hits : complete, line ];
};

/*
 * get the file paths
 */
var completion = [];

finder.on('path', function(file, stat){

  var test = (/^.git|node_modules|^\./i).test(file);
      test = !test && (/(\.(js|coffee)$)/i).test(file);

  if( test ){
    completion.push(file);
  }
});

finder.on('end', function(){
  completion.concat(
    host.getRuntime().get().completion
  );
});
