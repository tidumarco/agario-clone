"use strict";
const config = require('./config');
const Player = require('./bubble').Player;
const Food = require('./bubble').Food;
const Database = require('./database');

const sizeof = require('object-sizeof');

var fpsCount=0;

class Game {
  constructor(io) {
    this.io = io;   // this viittaa tämä olion jäsenmuuttujiin
    this.food = [];
    this.sockets = [];
    this.db = new Database();

    // initialize game
    this._init();
  }

  _init() {
    console.log("initializing game");

    this._generateFood();
    this._initSockets();
    console.log("running", config.fps, "frames per second")
    setInterval(this._gameLoop.bind(this), Math.round(1000 / config.fps));
    setInterval(function() { console.log("fps:", fpsCount/10); fpsCount = 0; }, 10000);
  }

  _generateFood() {
    console.log("generating food");
    for (let food = 0; food < config.food.amount; food++) {
      this.food.push(new Food());
    }
    console.log("food size", sizeof(this.food[0]));
    console.log("food size preferred", sizeof({x: 1, y: 1, idx: 10}));
    //TODO: decrease network traffic!
  }

  _initSockets() {
    console.log("initializing sockets");

    let game = this;
    this.io.on('connection', (socket) => {

      socket.player = new Player();
      console.log("player size", sizeof(socket.player));

      game.sockets.push(socket);
      console.log("socket connected");

      socket.on('client:login', (data) => {
        let resp = socket;
        console.log('handling login attempt');
        game.db.login(data, function(successCode) {
          console.log("login", successCode);
          if(successCode == "success") {
            socket.player.name = data.name;
            socket.emit('server:login', {player: socket.player, food: game.food, response: successCode});
          }
          else {
            socket.emit('server:login', {player: [], food: [], response: successCode});

          }
        });
      });

      socket.on('client:register', (data) => {
        console.log(':game: client:register attempt', data);
        game.db.register(data, function(successCode) {
          console.log("register", successCode);
        });
        socket.player.name = data.name;
      });

      /* Update Player status */
      socket.on('client:update', (data) => {
        //console.log("player:status");
        game._calculateMovement(socket.player, data);
      });

      /* Handle disconnect */
      socket.on('disconnect', (reason) => {
        console.log("socket disconnected");
        delete game.sockets[game.sockets.indexOf(socket)];
      });
    });
  }

  _getAllPlayers() {
    let players = [];
    for(let x=0; x<this.sockets.length; x++) {
      players.push(this.sockets[x].player);
    }
    return players;
  }

  _calculateMovement(player, data) {
    if(!data.mouseX || !data.mouseY || (data.mouseX == player.x) || (data.mouseY == player.y)) { 
      return;
    }
    let diffX = (data.mouseX - player.x);
    let diffY = (data.mouseY - player.y);
    let moveX = config.player.speed * (Math.abs(diffX) / (Math.abs(diffX) + Math.abs(diffY)));
    let moveY = config.player.speed * (Math.abs(diffY) / (Math.abs(diffX) + Math.abs(diffY)));

    if (diffX < 0) {
      player.x -= moveX;
    }
    else {
      player.x += moveX;
    }

    if (diffY > 0) {
      player.y += moveY;
    }
    else {
      player.y -= moveY;
    }
    player.changed = true;
  }

  _syncClients() {
    /* sync only changed parts of the game to reduce network traffic - DONE */
    //console.log("syncing clients");
    let game = this;
    let dPlayers = [];  // Player deltas (i.e. changed player statuses)
    this.sockets.forEach(function (socket) {
      dPlayers.push(socket.player);
      if (socket.player.changed == true) {
        socket.player.changed = false;
      }
    });

    let dFood = []; // Food deltas (i.e. eaten foods)
    this.food.forEach(function (food) {
      if(food.changed == true) {
        dFood.push(food);
        food.changed = false;
      }
    });
    this.io.sockets.emit('server:sync', {food: dFood, players: dPlayers});
  }

  _detectCollision() {
    // Check for player/player & player/food collisions
    // Let food collide with each other
    let game = this;
    this.sockets.forEach(function (socket) {
      // Calculate eaten food
      let player = socket.player;
      game.food.forEach(function (food, index, object) {
        var dx = player.x - food.x;
        var dy = player.y - food.y;
        var distance = Math.sqrt(dx * dx + dy * dy);

        // Increase player size
        if (distance < player.radius + food.radius) {
          player.radius += (food.radius*2) / player.radius;
          // Food eaten -> replot
          food.replot();
        }
      });
    });

    // TODO: Check player collision

  }

  _gameLoop() {
    fpsCount++;
    this._detectCollision();
    this._syncClients();
  }
}
module.exports = Game;