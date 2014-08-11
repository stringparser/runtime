
var runtime = require('../lib/runtime');

describe('runtime.command', function(){

  describe('#set', function(){

    it('runtime({ nested : false }) should unest', function(){

      runtime({ nested : false }).set('first', function(){
        return ['first!']
      })

    })
  })

})

process.stdin.end();