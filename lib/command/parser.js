
/*
 * Module dependencies
 */

var util = require('../utils');
var minimist = require('minimist');

module.exports = function defaultParser(line){

  if(Array.isArray(line))
    return minimist(line);
  else if(typeof line === 'string')
    return minimist(line.split(/[ ]+/));
  else
    throw new util.Error(
      ' '+this._name+'.parser : The default parser needs an array or an `string`.'
    );
};
