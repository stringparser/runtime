/*
 * Module dependencies
 */

var util = require('../utils');
var merge = util.merge;

/*
 *
 */
exports = module.exports = Command;

/*
 *
 */

var command = {};

function Command(phoneme, nest){

  if( !phoneme ){
    throw new Error(
      ' Command argument `phoneme` undefined.\n'+
      ' Can\'t create a `command` instance.'
      );
  }

  if( !(this instanceof Command) ){
    return new Command(phoneme);
  }

  if(arguments.length === 1 && !command[phoneme]){
    setRoot(phoeneme);
  }

  /*
   * Closure variables
   */
  var root = command[phoneme];
  var anchor = command[phoneme];
  var depth = 0;

  nest = nest ? nest : true;

  /*
   * Chainable instance methods
   */
  this.set = function (name, handle){

    isCommand(name, handle);

    var node;

    if(name[0] === '-'){
      node = root;
    }
    else {
      node = anchor;
    }

    setCommand.call(node, name, handle);

    if(nest)
      anchor = anchor.children[name];

    depth++;
    return this;
  };

  this.get = function(/* arguments */){

    var args = Array.isArray(arguments[0]);
        args = args ? arguments[0] : [].slice.call(arguments);

    var len = args.length;
    var found = root;

    args.forEach(function(arg){

      if(found && found.children){
        found = found.children[arg];
      }
    });

    if(depth > 0){
      anchor = found;
      return this;
    }
    else {
      var ret = merge({}, found);
      return ret;
    }
  };

  return this;
}

/*
 *
 */

function setRoot(name){

  if(typeof name === 'string'){

    var root = command[name] ? command[name] : undefined;

    command[name] = {
          _name : name,
        _parent : name,
       children : root ? root.children : {},
     completion : root ? root.completion : []
    };

    if(!command.completion)
      command.completion = [name];
    else if(command.completion.indexOf(name) === -1)
      command.completion.push(name);

  }
  else {
    throw new TypeError('`'+name+'` is not a `string`');
  }

};
exports.setRoot = setRoot;

function getRoot(name){

  var root;

  if(typeof name === 'string'){
    root = merge({}, command[name])
  }
  else {
    root = merge({}, command);
  }

  return root;

};
exports.getRoot = getRoot;

/*
 *
 */

function setRootHandle(name, handle){

  if(typeof handle === 'function'){

    if(!command[name])
      setRoot(name);
    else
      command[name].handle = handle;
  }
  else {
    throw new TypeError('`'+name+'` is not a `function`');
  }

};
exports.setRootHandle = setRootHandle;

/*
 *
 */

function setCommand(name, handle){

  if(this.completion.indexOf(name) === -1){

    this.children[name] = {
         handle : handle,
          _name : name,
        _parent : this._name,
       children : {},
     completion : []
    };

    this.completion.push(name);
  }
  else
    throw new Error(' Command `'+name+'` is already defined.');

};
exports.setCommand = setCommand;
/*
 *
 */

function isCommand(name, handle){

  if(!name){
    throw Error('Falsey commands like "'+name+'" are not allowed.');
  }
  else if(typeof name !== 'string'){
    throw Error(
      'Command "'+name+"' should be a `string`."
    );
  }
  else if(typeof handle !== 'function'){
    throw Error(
      'Command "'+name+'" `handle` is not a function.'
    );
  }
};
exports.isCommand = isCommand;