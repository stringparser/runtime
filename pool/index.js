
var util = require('../lib/utils');

var runtime = require('../lib/runtime').Runtime('gulp');

console.log('---------------------')
runtime.set('hello', function hello(argv, args, next){

  console.log('\n Hello! \n');

}).set('world', function world(){

  console.log('\n Hello! \n consumed : ', 'world');
})
console.log('---------------------')



runtime.set('something', function something(argv, args, next){
  console.log('---------------------')
  console.log('\n Something! \n');
  console.log('---------------------')
}).set('else', function(){

  console.log('---------------------')
  console.log('\n Something! \n consumed : ', 'else');
  console.log('---------------------')
})
