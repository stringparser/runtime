/*
 * Module dependencies
 */
var resolve = require('path').resolve;

/*
 * Export depending on `env`
 */
module.exports = process.env.DEV_ENV
 ? require('./lib/runtime')
 : require( resolve(process.cwd(),'lib/runtime') )