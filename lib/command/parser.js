'use strict';

/*
 * Module dependencies
 */

var util = require('../utils');

module.exports = function defaultParser(line){

  if( util.type(line).array ){
    return util.argv(line);
  } else if(typeof line === 'string'){
    return util.argv(line.split(/[ ]+/));
  } else {
    throw new util.Error(
      ' '+this.config('name')+'.parser: '+
      ' The default parser needs an array or an `string`.'
    );
  }

};
