'use strict';

var http = require('http');
var app = require('../../.').create('myAppName');

app.set({
  onHandleNotFound: function(next, req, res){
    res.writeHead(404);
    res.end('404: There is no \''+req.url+'\' path defined yet.');
    next();
  }
});

app.set('get /', app.stack(index, query, end));

function index(next, req, res){
  res.write('Hello there ');
  return res;
}

function query(next, req, res){
  var name = req.url.match(/\?name=([^&]+)/);
  var user = name ? '<i>' + name[1] + '</i>' : '"anonymous"';
  res.write(user);
  return res;
}

function end(next, req, res){
  res.end(); next();
}

function router(req, res){
  var method = req.method.toLowerCase();
  app.stack(method + ' '+ req.url)(req, res);
}

http.createServer(router).listen(8000, function(){
  console.log('http server running on port 8000');
});