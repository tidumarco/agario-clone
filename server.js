const express = require('express');
const path = require('path');
const config = require('./server/config');
const Game = require('./server/game');
const Database = require('./server/database');

const app = express();
const port = 8000;
const ip = '0.0.0.0';

// Add support for Websockets
var server = require('http').Server(app);
var io = require('socket.io')(server);

var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static(__dirname + '/client'));

// Create database and game objects
const db = new Database();
const game = new Game(io);

/* Setup REST API */
app.post('/api/v1/login', upload.array(), function (req, res, next) {
  db.login(req.body, function(successCode) {
    res.send(successCode);
  });
});

app.post('/api/v1/register', function (req, res) {
  console.log("POST /api/v1/register", req.body);
  db.create(req.body, function(successCode) {
    res.send(successCode);
  });
});

app.get('/api/v1/config', function (req, res) {
  console.log("GET /api/v1/config", req.body);
  res.json(config);
});

server.listen(port, () => {
  console.log("server up and running @ http://localhost:" + port);
});

module.exports = app; // for TDD

