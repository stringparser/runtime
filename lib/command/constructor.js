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

var command = {
  handle : function root(){},
  children : {},
  completion : []
};

function Command(rootName, config){

  if( !rootName ){
    throw new Error(
      ' Command `rootName` is undefined.\n'+
      ' Can\'t create a `command` instance.'
      );
  }

  if( !(this instanceof Command) ){
    return new Command(rootName, config);
  }

  /*
   * Closure variables
   */
  var root = command.children[rootName];
      root = root ? root : setRoot(rootName);

  var anchor = command.children[rootName];

  var depth = 0;
  var nested = config.nested;

  /*
   * Chainable instance methods
   */

  /*
   * doc holder
   */
  this.set = function (name, handle){

    isCommand(name, handle);

    var node = name[0] === '-' ? root : anchor;

    setCommand.call(node, name, handle);

    if(nested){
      anchor = anchor.children[name];
    }
    depth++;

    return this;
  };

  /*
   * doc holder
   */
  this.get = function(/* arguments */){

    var args = Array.isArray(arguments[0]);
        args = args ? arguments[0] : [].slice.call(arguments);

    var len = args.length;
    var found = root;

    args.forEach(function(arg){

      if(found && found.children[arg]){
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

  /*
   *
   */
  return this;
}

/*
 *
 */

function setRoot(name){

  if(typeof name === 'string'){

    var root = command.children[name];
        root = root ? root : undefined;

    command.children[name] = {
          _name : name,
         _depth : 0,
        _parent : name,
       children : root ? root.children : {},
     completion : root ? root.completion : []
    };

    if(command.completion.indexOf(name) === -1)
      command.completion.push(name);

    return root;
  }
  else {
    throw new TypeError('`'+name+'` is not a `string`');
  }

};
exports.setRoot = setRoot;

function getRoot(name){

  var root;

  if(typeof name === 'string'){
    root = merge({}, command.children[name])
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

    if(!command.children[name])
      setRoot(name);

    command.children[name].handle = handle;
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
         _depth : this._depth+1,
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