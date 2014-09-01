
/**
 * Module dependencies
 **/

var util = require('./utils');
var merge = util.merge;

/**
 * A simple config function
 *
 * @param {String/Object} obj
 * @return this
 *
 *
 */

module.exports = function(){

  var config = { };

  return function (obj){

    var copy;
    var isString = util.isString(obj);
    var isObject = util.isObject(obj);

    if( !isString && !isObject ){
      copy = merge({ }, config);
      return copy;
    }

    if( isString )
      return config[obj];
    else
      merge(config, obj);

    return this;
  };
};
