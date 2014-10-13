'use strict';

var fs = require('fs');
var path = require('path');

var fileList = fs.readdirSync(
  path.resolve(path.dirname(module.parent.filename), 'on')
).slice(1);

exports = module.exports = { };

fileList.forEach(function(fileName){
  var name = path.basename(fileName, path.extname(fileName));
  exports[name] =  require('./'+fileName);
});

