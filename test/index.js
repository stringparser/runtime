'use strict';

require('should');

var fs = require('fs');
var pack = require('../package.json');

fs.readdirSync(__dirname).forEach(function(file){
  if(file === 'index.js'){ return; }
  describe(pack.name, function(){
    describe(file.split('.')[0], function(){
      require('./' + file);
    });
  });
});
