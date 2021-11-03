"use strict";

class Database {
  constructor(config) {
    this.mongoose = require('mongoose');
    this.Player = require('./model/player.js');
    // this.dbURI = config.db.connectionURI || 'mongodb://localhost:27017/agario';
    this.dbURI = 'mongodb://mongodb:27017/agario';

    console.log("trying to connect mongodb");
    this.mongoose.connect(this.dbURI, {
      useNewUrlParser: true
    });

    this.db = this.mongoose.connection;
    this.db.on('error', console.error.bind(console, 'connection error:'));
    this.db.once('open', function () {
      console.log("connected database");
    });
  }

  register(user, callback) {

    if (!user.name || !user.password) {
      console.log("missing register parameters", user);
      return;
    }

    console.log(":database: register", user);
    var player = new this.Player({ name: user.name, password: user.password });
    player.save(function (err, player) {
      if (err) {
        console.log("'%s' failed in account creation...", err);
        callback("fail");
      }
      else {
        console.log("Account creation passed. New account '%s' created.", user.name);
        callback("success");
      }
    });
  }

  login(player, callback) {

    if (!player.name || !player.password) {
      console.log("missing login parameters");
      return;
    }

    // Check database for player
    this.Player.findOne({ 'name': player.name }, function (err, foundPlayer) {
      if (err) {
        callback("error:", err);
      }
      if (!foundPlayer) {
        console.log("player", foundPlayer, " not found");
        callback("fail");
      } else {
        console.log("found player", player.name, foundPlayer);
        callback(foundPlayer.isValidPassword(player.password));
      }
    });
  }
}
module.exports = Database;