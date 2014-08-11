module.exports = process.env.DEV_ENV
 ? require('./lib/runtime')
 : require('runtime')