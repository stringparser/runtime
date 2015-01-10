'use strict';

exports = module.exports = boilFns;

function boilFns(argv){
  return argv.map(function(elem){
    var type = typeof elem;

    if(!(/string|function/).test(type)){
      throw new TypeError('stack(argv[, stack]):\n '+
      'element should be `string` or `function`');
    }

    if(type.length > 6){ // function

      Object.defineProperty(elem, 'toString', {
        writable: false,
        enumerable: false,
        configurable: true,
        value : function(){
          return '[Function:' + (this.name || this.displayName) + ']';
        }
      });

      if(!elem.name && !elem.displayName){
        throw new Error('Please, name your functions');
      }
    }

    return elem;
  });
}
