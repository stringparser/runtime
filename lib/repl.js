'use strict';

var util = require('./util');
var Manifold = require('manifold');
var readline = require('readline');

// this was the very beginning of it all :D
//
exports = module.exports = repl;

function repl(app, o){
  /* jshint validthis: true */
  if(!(app instanceof Manifold)){
    throw new Error('needs a runtime instance to make a repl');
  } else if(app.repl instanceof readline.Interface){
    return app;
  }

  o = o || { };
  app.repl = readline.createInterface({
    input: util.type(o.input).match(/stream/) || process.stdin,
    output: util.type(o.output).match(/stream/) || process.stdout,
    completer: util.type(o.completer).function ||
      function(line, callback){
        return completer(app, line, callback);
      }
  });
  app.repl.on('line', function(line){
    app.stack(line)();
  });

  if(!app.repl.terminal){ return app; }
  // the default prompt
  app.repl.setPrompt(' '+app.store.name+' > ');

  // keypress for SIGINT
  app.repl.input.removeAllListeners('keypress');
  app.repl.input.on('keypress', function (str, key){
    if( key && key.ctrl && key.name === 'c'){
      process.stdout.write('\n');
      process.exit(0);
    } else { app.repl._ttyWrite(str, key); }
  });

  return app;
}

// ## util.completer
// > completion for a command at caret position
//

function completer(app, line, callback){

  var hits = [ ], completion;
  var cmd = app.get(line,{ref: true});
  var match = line.match(/[ ]+\S+$|[ ]+$/);
  completion = app.get(cmd.parent, {ref: true}).children;
  completion = Object.keys(completion || app.get({ref: true}).children || {});

  if(match){ // start hits at last word
    line = line.substring(match.index, line.length).trim();
  }

  hits = completion.filter(function(elem){
    return elem.indexOf(line) === 0;
  });

  callback(null, [ hits.length ? hits : completion, line ]);
}

// ## util.pathlete
// > path completion
//
// function pathlete(partial, complete){
//   var cwd = process.cwd();
//   if( !complete.length ){
//     complete = fs.readdirSync(cwd).filter(function(pathname){
//       return !(/^\.|node_modules/i).test(pathname);
//     });
//     complete.push('..');
//   }
//   //
//   // return early for
//   //  - no matches
//   //  - something with extension
//   //  - path does not match initial basedirs
//   //
//   partial = (partial || '').trim();
//   var index;
//   var basedir = partial.split(path.sep)[0];
//   var resolved = path.resolve(cwd, partial);
//   if( path.extname(partial) ){  return complete;  }
//   if( complete.indexOf(partial) > -1 ){ return complete; }
//   if( (index = complete.indexOf(basedir)) < 0 ){  return complete;  }
//
//   try {
//     var lstat = fs.lstatSync(resolved);
//     if( !lstat.isDirectory() ){  return complete;  }
//   } catch(err){ return complete; }
//   // or didn't exist or wasn't a directory
//   // not useful to throw for tab completion
//
//   var notEmpty = false;
//   fs.readdirSync(resolved)
//   .forEach(function(pathname){
//     if( complete.indexOf(pathname) > -1 ){  return ;  }
//     complete.push(path.join(partial, pathname));
//     notEmpty = true;
//   });
//   complete[index] += path.sep;
//   return complete;
// }
