/*
 * Module dependencies
 */

var util = require('../utils');

module.exports = function defaultInterpreter(line){

  return line.replace(/(-{1,}\S{1,}|\d+)([ ]+)/g, '')
                 .split(/[ ]+/);
}