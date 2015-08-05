'use strict';

var util = require('./lib/util');

var store = {};

exports = module.exports = {
  Stack: require('./lib/Stack'),
  Runtime: require('./lib/Runtime'),
  create: function(name){
    if(store[name]){ return store[name]; }
    if(typeof name !== 'string'){ name = util.stringID(); }
    return (store[name] = new this.Runtime());
  }
};
