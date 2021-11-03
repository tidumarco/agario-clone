class Platform {
  constructor() {
    console.log(":platform: starting platform")
    this.gameDomain = 'http://localhost:8080';
    this.config = {};
    this.player = {};
    this.food = [];

    /* Platform initialization */
    this._init();
    console.log(":platform: platform up and running")
  }

  _init() {
    console.log(":platform: initializing platform");
    this._getConfig();
    this._initRenderer();
    this._connectServer();
  }

  _initRenderer() {
    console.log(":platform: initializing renderer");
    this.canvas = document.getElementById('gameboard');
    this.ctx = document.getElementById('gameboard').getContext("2d");

    window.addEventListener("mousemove", (event) => {
      // Must be calculated relative to viewport center
      //platform.player.mouseX = event.clientX;
      //platform.player.mouseY = event.clientY;
      platform.player.mouseX = event.clientX + (platform.player.x - window.innerWidth / 2);
      platform.player.mouseY = event.clientY + (platform.player.y - window.innerHeight / 2);
    });

    window.addEventListener("resize", (event) => {
      //console.log("resize event");
      platform.canvas.setAttribute('width', window.innerWidth);
      platform.canvas.setAttribute('height', window.innerHeight);
    });

    this.canvas.setAttribute('width', window.innerWidth);
    this.canvas.setAttribute('height', window.innerHeight);

    /* Start game in Login Mode */
    this._loginMode();
  }

  _gameMode() {
    console.log("switching to Game Mode");
    let gameboard = document.getElementById('gameboard');
    gameboard.style.visibility = "visible";
    let leaderboard = document.getElementById('leaderboard');
    leaderboard.style.visibility = "visible";
    let login = document.getElementById('login');
    login.style.display = "none";
    setInterval(this._gameLoop.bind(this), Math.round(1000 / this.config.fps));
  }

  _loginMode() {
    console.log("switching to Login Mode");
    let gameboard = document.getElementById('gameboard');
    gameboard.style.visibility = "hidden";
    let leaderboard = document.getElementById('leaderboard');
    leaderboard.style.display = "hidden";
    let login = document.getElementById('login');
    login.style.display = "block";
  }

  _getConfig() {
    axios({
      url: this.gameDomain + '/api/v1/config',
      method: 'get'
    })
      .then(function (response) {
        if (response.data) {
          Object.assign(platform.config, response.data);
        }
        else {
          console.log(":platform: unable to load configuration file", response);
        }
      })
      .catch(function (error) {
        console.log(":platform: error loading configuration file", error);
      });
  }

  _connectServer() {
    this.socket = io(this.gameDomain);
    const socket = this.socket; // handle

    socket.on('connect', function () {
      console.log(":platform: server connected");
    });

    socket.on('server:login', (data) => {
      console.log("handling server:login", data);
      /* Contains response on login attempt and player object */
      if (data.response == "success") {
        Object.assign(platform.player, data.player);
        platform.food = Array.from(data.food);
        platform._gameMode();
      }
      else {
        platform._loginMode();
      }
    });

    socket.on('server:sync', (data) => {
      /* Render food and all the players */
      console.log("Amounts: players", data.players.length, "food", data.food.length);
      platform._clearCanvas();

      data.food.forEach(function (food) {
        platform.food[food.idx] = food;
      });

      /* Render data */
      platform._render(data.players);
      platform._render(platform.food);
    });
  }

  _render(bubbles) {
    let game = this;
    /* Clear previous state */
    if (!bubbles) {
      return;
    }
    bubbles.forEach((bubble) => {
      if (bubble.name) {
        if (bubble.name == this.player.name) {
          Object.assign(game.player, bubble);
        }
        console.log("plotting", bubble.name, "at", bubble.x, bubble.y);
        this._plot(bubble.x, bubble.y, bubble.radius, bubble.color, bubble.name);
      }
      else {
        /* Plot food */
        this._plot(bubble.x, bubble.y, bubble.radius, bubble.color, bubble.name);
      }
    });
    /* Plot player */
    this._plot(this.player.x, this.player.y, this.player.radius, this.player.color, this.player.name);
  }

  _plot(x, y, radius, color, name) {

    // Render according to viewport (player location on map)
    let dX = Math.abs(this.player.x - x);
    let dY = Math.abs(this.player.y - y);

    if (dX < (window.innerWidth / 2) && dY < (window.innerHeight / 2)) {
      let topleft = {
        x: this.player.x - window.innerWidth / 2,
        y: this.player.y - window.innerHeight / 2
      };
      this._plotViewport(x - topleft.x, y - topleft.y, radius, color, name);
    }
  }

  _plotViewport(x, y, radius, color, name) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    if (name) {
      this.ctx.font = "30px Arial";
      this.ctx.fillStyle = "black";
      this.ctx.fillText(name, x - 30, y + 10);
    }
    this.ctx.stroke();
  }

  _clearCanvas() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  _gameLoop() {
    this.socket.emit('client:update', this.player);
  }

  /** PUBLIC API **/
  login(name, password) {
    console.log(":platform: login");
    this.player.name = name;
    this.player.password = password;
    this.socket.emit('client:login', { name: this.player.name, password: this.player.password });
  }

  register(name, password) {
    console.log(":platform: register");
    this.socket.emit('client:register', { name: name, password: password });
  }

  logout() {
    this.socket.emit('client:logout', { name: this.player.name, password: this.player.password });
    this._loginMode();
  }
}

const platform = new Platform();