
var eurecaServer;
var avatar;
var player;
var moveSpeed = 2;
var cursors;
var map;
var layer0;
var ready = false;
var players = {};


var eurecaClientSetup = function() {
  var eurecaClient = new Eureca.Client();

  eurecaClient.ready(function (proxy) {
    eurecaServer = proxy;
  });

  // "exports" methods are server-side
  eurecaClient.exports.setId = function(id){
    myId = id;
    create();
    eurecaServer.handshake();
    ready = true;
  }

  eurecaClient.exports.kill = function(id){
    if (players[id]){
      players[id].kill();
      console.log(`killing ${id}`);
    }
  }

  eurecaClient.exports.spawnPlayer = function(h, e, x){
    if (h == myId) return; // only spawn other players

    console.log('PLAYER SPAWN');
    var plr = new Player(h, game, avatar);
    players[h] = plr;
  }

  eurecaClient.exports.updateState = function(id, state){
    if (players[id]){
      players[id].cursor = state;
      players[id].avatar.x = state.x;
      players[id].avatar.y = state.y;
      players[id].update();
    }
  }
}

Player = function(index, game, avatar){
  this.cursor = {
    left: false,
    right: false,
    up: false,
    down: false
  }

  this.input = {
    left: false,
    right: false,
    up: false,
    down: false
  }

  var x = 0;
  var y = 0;

  this.game = game;
  this.avatar = game.add.sprite(32, 32, 'avatar');
  game.add.existing(this.avatar); // you have to do this
  this.avatar.animations.add('walk');
  this.avatar.id = index;
  game.physics.enable(this.avatar, Phaser.Physics.ARCADE);
  this.avatar.immovable = false;
  this.avatar.collideWorldBounds = true;
  this.moveSpeed = moveSpeed;

  // end Player
};

Player.prototype.update = function(){
  var inputChanged = (
    this.cursor.left != this.input.left ||
    this.cursor.right != this.input.right ||
    this.cursor.up != this.input.up ||
    this.cursor.down != this.input.down
  );

  if (inputChanged){
    // send new keypresses to server
    if (this.avatar.id == myId){
      this.input.x = this.avatar.x;
      this.input.y = this.avatar.y;

      eurecaServer.handleKeys(this.input);
    }
  }

  if (this.cursor.left == false &&
    this.cursor.right == false &&
    this.cursor.up == false &&
    this.cursor.down == false){
    this.avatar.animations.stop();
  } else {
    this.avatar.animations.play('walk', 50, true);
  }

  // actual player movement calculation
  if (this.cursor.up){
    this.avatar.y -= this.moveSpeed;
  }
  if (this.cursor.down){
    this.avatar.y += this.moveSpeed;
  }
  if (this.cursor.left){
    this.avatar.x -= this.moveSpeed;
  }
  if (this.cursor.right){
    this.avatar.x += this.moveSpeed;
  }

  // end Player.update
}

Player.prototype.kill = function() {
  this.avatar.kill();
}

//
// GUI
//
var menuScreen;
var gameScreen;

function setupGUI() {
  EZGUI.components.playBtn.on('click', function() {
    gameScreen.visible = true;
    menuScreen.visible = false;
  });

  EZGUI.components.quitBtn.on('click', function() {
    gameScreen.visible = false;
    menuScreen.visible = true;
  })
}

EZGUI.Theme.load(['../EZGUI/assets/metalworks-theme/metalworks-theme.json'], function() {
  menuScreen = EZGUI.create(menuScreenJSON, 'metalworks');

  gameScreen = EZGUI.create(gameScreenJSON, 'metalworks');
  gameScreen.visible = false;

  setupGUI();
});

//
// Setup the main game
// note: create() subbed with eurecaClientSetup(), where we call create()
//
var game = new Phaser.Game(1024, 512, Phaser.AUTO, '', { preload: preload, create: eurecaClientSetup, update: update, render: render });

function preload() {
  game.load.spritesheet('avatar', 'assets/player.png', 32, 32);
  game.load.tilemap('map', 'assets/map.csv');
  game.load.image('tileset','assets/tileset.png');
}

function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  map = game.add.tilemap('map', 32, 32);
  map.addTilesetImage('tileset');

  layer0 = map.createLayer(0);
  layer0.resizeWorld();

  player = new Player(myId, game, avatar);
  players[myId] = player;
  avatar = player.avatar;
  player.avatar.x=0;
  player.avatar.y=game.world.height*Math.random();

  cursors = game.input.keyboard.createCursorKeys();
}


function update() {
  if (!ready) return;

  // update player movements (server processes them later)
  player.input.left = cursors.left.isDown;
  player.input.right = cursors.right.isDown;
  player.input.up = cursors.up.isDown;
  player.input.down = cursors.down.isDown;

  for (var i in players) {
    players[i].update();
  }
};

function render() {}
