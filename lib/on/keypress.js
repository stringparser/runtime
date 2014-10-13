'use strict';

module.exports = function keypress(s, key){
  if(key && key.ctrl && key.name === 'c'){
    process.stdout.write('\n');
    this.close();
    process.exit(0);
  } else {
    this._ttyWrite(s, key);
  }
};
