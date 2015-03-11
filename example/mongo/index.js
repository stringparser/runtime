'use strict';

var mongodb = require('mongojs');
var db = mongodb('db', ['users']);
var app = require('../../.').create('mongo-example');

function remove(next){
  this.remove({}, next);
}

function count(next){
  this.count(next);
}

function insert(next, result, user){
  this.insert(user, next);
}

function find(next){
  this.find(next);
}

var query = app.stack(remove, count, insert, find, {
  wait: true,
  context: db.users,
  onHandleEnd: function(next){
    this.results = this.results || [ ];
    this.results.push({
      name: next.match,
      result: this.args.slice(1)
    });
    if(this.pile){ return ; }
    console.log('-------------');
    this.results.forEach(function(stack){
      console.log(stack.name);
      console.log(' ',stack.result[0], stack.result[1]);
    });
  }
});

query(null, {name: 'johnny'});
