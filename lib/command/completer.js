'use strict';

/*
 * Module dependency
 */
var debug = require('debug')('cmd:completer');

module.exports = function defaultCompleter(line){

  var complete = this.config('completion').slice();
  var prev = this.lexer(line);
  var hits = [];

  if(prev[1]){
    line = line.substring(line.indexOf(prev.pop()));
  }

  debug('\n');
  debug('prev = ', prev);
  debug('line = ', line);
  debug('completion = ', complete);

  (this.get(prev).completion || [ ]).forEach(function(elem){
    if(complete.indexOf(elem) < 0){
      complete.push(elem);
    }
  });

  hits = complete.filter(function(c){
    return c.indexOf(line) === 0;
  });

  if( !hits[0] ){
    prev.forEach(function(elem){
      var index = complete.indexOf(elem);
      if( index > -1 ){
        complete.splice(index, 1);
      }
    });
  }

  return [ hits[0] ? hits : complete, line ];
};
