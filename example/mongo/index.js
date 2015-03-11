'use strict';

var mongodb = require('mongojs');
var db = mongodb('db', ['users']);
var app = require('../../.').create('mongo-example');

function remove(next){
  db.users.remove({}, next);
}

function count(next){
  db.users.count(next);
}

function insert(next, result, user){
  db.users.insert(user, next);
}

function find(next){
  db.users.find(next);
}

var query = app.stack(remove, count, insert, find, {
  wait: true,
  log: false,
  onHandleEnd: function(next){
    this.results = this.results || [ ];
    this.results.push({
      name: next.match,
      result: this.args.slice(1)
    });
    if(this.pile){ return ; }
    this.results.forEach(function(stack){
      console.log(stack.name, stack.result[0], stack.result[1]);
    });
  }
});

query(null, {name: 'johnny'});
