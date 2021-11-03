const config = require('./config');

let idxFood = 0;
let idxPlayer = 0;

class Bubble {
  constructor(x, y, radius, color, name) {
    this.x = Math.random()*config.map.x;
    this.y = Math.random()*config.map.y;
    this.radius = config.food.radius || radius;
    this.color = color || config.food.colors[Math.floor(Math.random()*config.food.colors.length)];
    this.changed = false;
  }
/*
  update(x,y) {
    this.x = x;
    this.y = y;
    this.changed = true;
  }

  free() {
    console.log("freeing", this.idx);
    this.name = false;
    this.changed = false;
  } */
  
  replot() {
    //console.log("replotting", this.idx);
    this.changed = true;
    this.x = Math.random()*config.map.x;
    this.y = Math.random()*config.map.y;
    this.radius = config.food.radius;
    this.color = config.food.colors[Math.floor(Math.random()*config.food.colors.length)];
  }
}

class Food extends Bubble {
  constructor(x, y, radius, color, name) {
    super(x, y, radius, color, name);

    this.radius = config.food.radius;
    this.idx = idxFood++; // For iterating arrays on server and client

  }
}

class Player extends Bubble {
  constructor(x, y, radius, color, name) {
    super(x, y, radius, color, name);

    this.radius = config.player.radius;
    this.name = "guest" + Math.round(Math.random()*100000);
    this.idx = idxPlayer++; // For iterating arrays on server and client
    this.speed = config.player.speed;

  }  
  assign(name) {
    console.log("assigning player")
    // If name is set, this is a player bubble
    this.name = name;
    this.radius = config.player.radius;
    this.changed = true;
    this.x = 1000; //Math.random()*config.map.x;
    this.y = 1000; //Math.random()*config.map.y;
  }
}

module.exports = {Food, Player};