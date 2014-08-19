/*
 * Module dependencies
 */

var fs = require('fs');
var path = require('path');
var util = require('../utils');

var Herror = require('herro').Herror;

var merge = util.merge;
var assert = util.assert;
var __slice = [].slice;

/*
 *
 */

exports = module.exports = Command;

/*
 *
 */

var command = {
  _name : '#root',
  handle : function root(){},
  children : {},
  completion : []
};

function Command(config){

  var rootName = config.name;

  if( !rootName ){
    throw new Herror(
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
  var root = rootName === '#root' ? command : command.children[rootName];
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

    isCommand(name, handle, root);

    name = Array.isArray(name) ? name : [name];

    name[0] = name[0].trim();

    var node;
    if(name.length === 1){

      node = name[0][0] === '-' ? root : anchor;
      setCommand.call(node, name[0], handle);
    }
    else {

      node = name[0][0] === '-' ? root : anchor;

      setCommand.call(node, name[0], handle);

      name.slice(1).forEach(function(stem){

        stem = stem.trim();
        node.aliases[stem] = name[0];

        if(node.completion.indexOf(stem) === -1){
          node.completion.push(stem);
        }

      });
    }


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

    var args = __slice.call(arguments);

    var len = args.length;
    var found = root;

    args.forEach(function(arg){

      if(found && found.aliases[arg]){
        found = found.children[found.aliases[arg]];
      }
      else if(found && found.children[arg]){
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
   * doc holder
   */
  this.completion = function(stems){

    var arr = stems;
    if(typeof stems === 'function'){
        arr = stems();
    }

    var areStrings = arr.filter(function(el){
      return !util.isString(el);
    }).length === 0;

    var node = anchor._name[0] === '-' ? root : anchor;

    if(!areStrings){
      throw new Herror(
        '\n\n'+
        '  At `'+root._name+'` runtime, for `'+node._name+'.completion` \n\n'+
        '  Unsupported type. Completion should either be:\n\n'+
        '   - An Array\n'+
        '   - A Function returning an Array\n'
      );
    }

    arr.forEach(function(stem){
      if(node.completion.indexOf(stem) === -1)
        node.completion.push(stem);
    });

    return this;
  };
  /*
   * doc holder
   */
  this.handle = function(handle){

    if(typeof handle === 'function'){
      anchor.handle = handle;
    }
    else
      throw new Herror(
        '['+root._name+'] '+anchor._name+'.handle : \n'+
        '  - Unsupported type. A handle should be a function\n'
      );

    return this;
  };

/*
 *
 */

  this.version = function(number, comment){

    var version = root.version = {};

    if(number){
      merge(version, {
        number : number
      });
    }

    if(comment){
      merge(version, {
        comment : comment
      });
    }

    return this;
  };


  /*
   *
   */
  return this;
}

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
        aliases : {},
       children : {},
     completion : []
    };

    this.completion.push(name);
  }

}
exports.setCommand = setCommand;

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
        aliases : root ? root.aliases : {},
       children : root ? root.children : {},
     completion : root ? root.completion : []
    };

    if(command.completion.indexOf(name) === -1)
      command.completion.push(name);

    return root;
  }
  else {
    throw new Herror('`'+name+'` is not a `string`');
  }

}
exports.setRoot = setRoot;

function getRoot(name){

  var root;

  if(typeof name === 'string'){
    root = merge({}, command.children[name]);
  }
  else {
    root = merge({}, command);
  }

  return root;

}
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
    throw new Herror('`'+name+'` is not a `function`');
  }

}
exports.setRootHandle = setRootHandle;

/*
 *
 */

function isCommand(name, handle, root){

  if(!name){
    throw new Herror('Falsey commands like "'+name+'" are not allowed.');
  }
  else if(Array.isArray(name)){

    name.forEach(function(stem){

      if(!Array.isArray(stem)){
        isCommand(stem, handle, root);
      }
      else {
        throw new Herror(' Don\'t nest arrays for command names.');
      }
    });
  }
  else if( typeof name !== 'string' ){
    throw new Herror(
      'Command "'+name+"' should be a `string` or an `array`."
    );
  }
  else if(handle._depth === 1 && name !== root._name){
    throw new Herror('Can\'t name a command like its root name');
  }
  else if(typeof handle !== 'function'){
    throw new Herror(
      'Command "'+name+'" `handle` is not a function.'
    );
  }
}
exports.isCommand = isCommand;
