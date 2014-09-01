/*
 * Module dependencies
 */

var util = require('../utils');
var config = require('../config');

var merge = util.merge;

/*
 * Command constructor
 *
 * @params {Object} options
 * @returns {Object} command instance
 *
 * @api: private
 */

exports = module.exports = function(options){

  options = util.isObject(options) ? options : { };
  options.nested = util.isBoolean(options.nested) ? options.nested : true;
  options.forbid = typeof options.forbid === 'string' ? [options.forbid] : options.fobid;

  var name = options.name || '#root';
  var root = {
         _name : name,
        _depth :  0,
        plugin : { },
       aliases : { },
      children : { },
    completion : [ ]
  };
  var anchor = root;
  var found = root;
  var forbid = ['set', 'get'];

  if( options.forbid && !areStrings(options.forbid) )
    throw new Error('forbidden properties should be an `array` of `strings`');
  else if( options.forbid !== void 0 )
    forbid = forbid.concat.apply(forbid, options.forbid);


  /*
   * command as a config wrapper
   *
   * @param  {Object}   obj
   * @return {Function} this.options
   */

  var command = function(obj){
    return this.config(obj);
  };

  command.config = config();

  /*
   * command prototype
   */

  /*
   * doc holder
   */

  command.plug = function(name, handle){

    var isString = util.isString(name);
    var isObject = util.isObject(name);

    if( !isString && !isObject )
      throw new Error('plugin `name` should be a `string` or an `object`');

    if( isString && handle && typeof handle !== 'function' )
      throw new Error('if given, plugin `handle` should be a `function`');

    if( isString && handle && forbid.indexOf(name) > -1 )
      throw new Error('plugin name can\'t override these: \n - `'+forbid.join('`\n - `')+'');

    if( handle ) {

      root.plugin[name] = handle;

      var self = this;
      this[name] = function(/* arguments */){
        var args = [].slice.call(arguments);
        return handle.apply(self, args.concat(found));
      };

    } else if( isObject )  {

      Object.keys(name).forEach(function(key){
        this.plug(key, name[key]);
      }, this);
    }

    return this;
  };

  /*
   * doc holder
   */

  command.set = function (/* arguments */){

    var name, handle, node;
    var args = [].slice.call(arguments),
         len = arguments.length;

    if( typeof args[len-1] === 'function' )
      handle = args.pop();

    if( util.isString(args[0]) ){

      name = args[0].trim().split(/[ ]+/);
      node = name[0][0] === '-' ? root : anchor;

      if( name.length === 1 ){
        setCommand(node, name[0], handle);
      } else {

        name.forEach(function(cmd, index){

          if(node._depth !== 0)
            this.get(name.slice(0,index+1));

          setCommand(anchor, cmd, handle);

        }, this);

        anchor = root;
      }

    } else if( Array.isArray(args[0]) && areStrings(args[0]) ){

      name = args;
      node = name[0][0] === '-' ? root : anchor;
      setCommand(node, name[0], handle);
      name.slice(1).forEach(function(stem){

        stem = stem.trim();
        node.aliases[stem] = name[0];

        if(node.completion.indexOf(stem) === -1){
          node.completion.push(stem);
        }

      });

    } else {
      throw new Error('first argument should be a `string` or an `array` of `strings`');
    }

    return this;
  };

  /*
   * doc holder
   */
  command.get = function(/* arguments */){

    var args = [].slice.call(arguments),
         len = args.length;

    if(args.length === 0){
      anchor = root;
      return this;
    }

    if( len === 1 && util.isString(args) ){
      args = args.trim().split(/[ ]+/);
    } else if( len === 1 && !areStrings(args) ){
      throw new Error('argument[0] should be a `string` or an `array` of `strings`');
    }

    found = root;
    args = args.filter(function(arg){

      if(found && found.aliases[arg])
        found = found.children[found.aliases[arg]];
      else if(found && found.children[arg])
        found = found.children[arg];
      else
        return false;

      if(found)
        return true;
    });

    anchor = found;
    if(args.length === 0)
      found = null;

    return this;
  };

  command.plug('value', function(found){

    var copy = merge({}, found);
    return copy;
  });

  /*
   * doc holder
   */
  command.plug('completion', function(stems){

    var arr = stems;
    if(typeof stems === 'function'){
        arr = stems();
    }

    var root = this.get().value();
    var node = anchor._name[0] === '-' ? root : found;

    if(!areStrings(arr)){
      throw new Error(
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
  });

  /*
   * doc holder
   */
  command.plug('handle', function(handle, found){

    if(typeof handle === 'function')
      found.handle = handle;
    else
      throw new Error(
        ' For `'+found._name+'`.handle : \n'+
        '  - Unsupported type. A handle should be a function\n'
      );

    return this;
  });

  /*
   *
   */
  command.plug('version', function(number, comment, found){

    found = found === null ? { } : found;
    var version = found.version = { };

    if(number)
      merge(version, { number : number });

    if(comment)
      merge(version, { comment : comment });

    return this;
  });

  /*
   *
   */
  command.plug('log', function(){
    console.log('root = \n', root);
    console.log('anchor = \n', anchor);
    console.log('found = \n', found);
    return this;
  });

  return command;
};

function setCommand(node, name, handle){

  if(node.completion.indexOf(name) === -1){

    node.children[name] = {
          _name : name,
         _depth : node._depth+1,
        _parent : node._name,
        aliases : {},
       children : {},
     completion : []
    };

    node.completion.push(name);

    if( typeof handle === 'function' )
      node.children[name].handle = handle;
  }
}

/*
 *
 */

function isCommand(name, handle){

  if(Array.isArray(name)){

    name.forEach(function(stem){

      if(!Array.isArray(stem)){
        isCommand(stem, handle);
      } else {
        throw new Error(' Don\'t nest arrays for command names.');
      }
    });

  } else if( typeof name !== 'string' ){

    throw new Error(
      'Command "'+name+"' should be a `string` or an `array`."
    );

  } else if(!name){

    throw new Error('Falsey commands like "'+name+'" are not allowed.');
  }
}


/*
 *
 */

function areStrings(arr){

  if( !Array.isArray(arr) ){
    return false;
  } else {

    return arr.filter(function(elem){
      return util.isString(elem);
    }).length === arr.length;

  }
}
