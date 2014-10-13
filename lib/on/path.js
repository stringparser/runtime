'use strict';

var path = require('path');
var findit = require('findit');

module.exports = function(basedir, pathCompletion){
  findit('.').on('path', function(file){
    var test = (/^.git|node_modules|^\./i).test(file);
        test = !test && !(/^test/i).test(file);

    if( test && path.extname(file).match(/\.(js|coffee)/) ){
      pathCompletion.push(file);
    }
  });
};
