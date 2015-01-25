'use strict';

var Manifold = require('manifold');

exports = module.exports = repl;

function repl(app, o){
  if(app && app.repl){return app;}

  /* jshint validthis: true */
  if(!(app instanceof Manifold)){
    app = this.create('#repl');
  }

  o = o || { };
  if(typeof o.completer !== 'function'){
    o.completer = completer;
  }

  // this was the very beginning of it all :D
  var readline = require('readline');
  app.repl = readline.createInterface(o);

  app.repl.on('line', function(line){
    app.next(line)();
  });

  if(!o.terminal){ return app; }

  // the default prompt
  app.repl.setPrompt(' '+app.store.name+' > ');

  // modify the default keypress for SIGINT
  app.repl.input.removeAllListeners('keypress');
  app.repl.input.on('keypress', function (s, key){
    if( key && key.ctrl && key.name === 'c'){
      process.stdout.write('\n');
      process.exit(0);
    } else { app.repl._ttyWrite(s, key); }
  });

  return app;
}

// ## getCompletion
// > provide completion for a command
//

function getCompletion(app, line){
  var completion = [ ];
  var cmd = app.get(line);
  var anchor = app.get(cmd.parent);
  (cmd.completion || [ ])
  .concat(anchor.completion || [ ]).forEach(function(elem){
    if(completion.indexOf(elem) < 0){
      completion.push(elem);
    }
  });
  return completion;
}

// ## util.completer
// > provide completion for a command at caret pos
//

var pathlet = null;
function completer(app, line, callback){
  pathlet = pathlet || [ ];

  var hits = [ ];
  var match = line.match(/[ ]+\S+$|[ ]+$/);
  var completion = getCompletion(app, line);

  if( match ){
    //util.pathlete(match[0], pathlet);
    line = line.substring(match.index, line.length).trim();
  }

  hits = completion.concat(pathlet).filter(function(elem){
    return elem.indexOf(line) === 0;
  });
  callback(null, [ hits.length ? hits : completion, line ]);
}

// ## util.pathlete
// > provide path completion for a command
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
