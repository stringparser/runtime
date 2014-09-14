'use strict';

/*
 * Module dependency
 */
var util = require('../utils');
var debug = require('debug')('cmd:completer');

module.exports = function defaultCompleter(line){

  var hits = [];
  var prev = this.lexer(line);
  var complete = util.completion(this, prev);

  if(prev[0]){
    line = line.substring(line.indexOf(prev.pop()));
    complete = this.config('completion').slice().concat(complete);
  }

  debug('\nprev = ', prev);
  debug('line = ', line);
  debug('completion = ', complete);

  complete.forEach(function(elem){
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
