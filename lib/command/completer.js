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

  var terminal = host.getInterface();

  var hits = [];
  var completion = this.get().completion || [];

  (this.get(line).completion || []).forEach(function(elem){
    if(completion.indexOf(elem) < 0)
      completion.push(elem);
  });

  var offset = line.split(/[ ]+/);
  var last = offset.pop();
  var prev = line.split(last).slice(0,-1).join();

  completion.forEach(function(c){

    if( c.indexOf(last) === 0 )
      hits.push( prev ? prev + c : c);
  });

  return [ hits[0] ?
    hits : completion, line
  ];
};
