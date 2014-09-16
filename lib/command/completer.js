'use strict';

/*
 * Module dependency
 */
var util = require('../utils');
var debug = require('debug')('cmd:completer');

module.exports = function defaultCompleter(line){

  var hits = [];
  var lexed = this.lexer(line);
  var completion = util.completion(this, lexed);

  if( line.match(/[ ]+/) ){

    completion = completion.concat(
      this.config('completion').slice() || []);

    var spaceEnd = line.match(/[ ]+\S+$/);
    if( spaceEnd ){
      line = line.substring(spaceEnd.index, line.length).trim();
    }
  }

  debug('line = ', line);
  debug('lexed = ', lexed);
  debug('completion =', completion);

  lexed.forEach(function(elem){
    var index = completion.indexOf(elem);
    if( index > -1 ){
      completion.splice(index, 1);
    }
  });

  hits = completion.filter(function(elem){
    return elem.indexOf(line) === 0;
  });

  debug('hits', hits);

  return [ hits[0] ? hits : completion, line ];
};
