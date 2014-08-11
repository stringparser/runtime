
var runtime = new require('runtime').createInterface('testCommand');

describe('runtime.command', function(){

  describe('#set', function(){

    it('runtime({ nested : false }) should unest', function(){

      runtime({ nested : false })
        .set('first', function(){
          return ['first!']
        })
        .set('second', function(){

        })

    })
  })

})

process.stdin.end();