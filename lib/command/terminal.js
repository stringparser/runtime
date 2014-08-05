

module.exports = function defaultTerminal(arg, args, cb){

  console.log('\n `this` on the terminal\n', this, '\n')
  console.log(' `%s` is next', JSON.stringify(arg));

  console.log('\n If defined command will be followed\n  ', arguments)

  cb();
}