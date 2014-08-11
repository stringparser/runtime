/*
 * Module dependencies
 */
var resolve = require('path').resolve;

if(process.env.DEV_ENV){
  console.log('> Careful! Using dev code:', resolve(process.cwd(),'lib/runtime'), '\n')
}
/*
 * Export depending on `env`
 */
module.exports = process.env.DEV_ENV
 ? require( resolve(process.cwd(),'lib/runtime') )
 : require('./lib/runtime');