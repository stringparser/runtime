
var Command = require('../lib/command/constructor');
    Command.setRoot('gulp');

var runtime = {
  _name : 'gulp',
  set : function(name, handle){

    return (new Command(this._name, true)).set(name, handle);
  },
  get : function(/* arguments */){

    var cmd = (new Command(this._name));
    return cmd.get.apply(cmd, [].slice.call(arguments))
  }
}

runtime.set('first', function(){

}).get().set('second', function(){

}).set('third', function(){

}).set('fourth', function(){});

module.exports = Command;