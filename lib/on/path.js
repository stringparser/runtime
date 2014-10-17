'use strict';

var path = require('path');
var findit = require('findit');

module.exports = function (basedir, pathCompletion){
  findit(basedir || '.').on('path', finder);
  function finder(file){
    var pass = !(/^test/i).test(file)
            && !(/^.git|node_modules|^\./i).test(file)
            && path.extname(file).match(/\.(js|coffee)/);

    if( !pass ){ return ; }
    pathCompletion.push(file);
  }
  return this;
};
