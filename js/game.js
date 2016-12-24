
var eurecaServer;
var avatar;
var player;
var moveSpeed = 200;
var keys;
var map;
var layer0;
var ready = false;
var players = {};
var overworld = [
];

Room = function(id, x, y, neighbors){
  this.id = id;
  this.width = x;
  this.height = y;
  this.neighbors = neighbors;
}

var defaultFont = {
  font: '16px Arial',
  fill: '#fff',
  align: 'center'
}

var chatFont = {
  font: '12px Arial',
  fill: '#fff',
  align: 'left'
}


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
  }

  eurecaClient.exports.kill = function(id){
    if (players[id]){
      players[id].kill();
      console.log(`killing ${id}`);
    }
  }

  eurecaClient.exports.spawnPlayer = function(h, e, x){
    if (h == myId) return; // only spawn other players

    console.log(`PLAYER SPAWN: ${h}`);
    var plr = new Player(h, game, avatar, "Player");
    players[h] = plr;
  }

  eurecaClient.exports.updateState = function(id, state){
    if (!players[id]) return;

    players[id].cursor = state.input;
    players[id].avatar.x = state.x;
    players[id].avatar.y = state.y;
    if (players[id].nick != state.nick) players[id].setNick(state.nick);

    players[id].update();
  }
}

//
// Player class, methods
//
Player = function(index, game, avatar, nick, room){
  this.cursor = {
    left: false,
    right: false,
    up: false,
    down: false
  }

  this.state = {
    input: {
      left: false,
      right: false,
      up: false,
      down: false
    },
    nick: nick,
    room: (room || 1)
  }

  var x = 0;
  var y = 0;

  this.game = game;

  // avatar
  this.avatar = game.add.sprite(32, 32, 'avatar', 0);
  this.avatar.animations.add('walk', [0, 1, 0, 2], 10, true);
  game.physics.enable(this.avatar, Phaser.Physics.ARCADE);
  this.avatar.body.setSize(16, 32, 8, 0);
  this.avatar.body.collideWorldBounds = true;
  this.avatar.id = index;

  // default stats
  this.moveSpeed = moveSpeed;

  // username
  this.nick = nick;
  this.label = game.add.text(0, 0, this.state.nick, defaultFont);
  this.label.anchor.set(0.5);
  this.label.alignTo = function(sprite, pct_x, pct_y, pad_x, pad_y){
    this.x = Math.floor(sprite.x + (pct_x*sprite.width) + pad_x);
    this.y = Math.floor(sprite.y + (pct_y*sprite.height) + pad_y);
  }
  this.setNick = function(text) {
    this.nick = this.state.nick = this.label.text = text.slice(0,20);
  }

  // navigation
  this.room = 1;

  // chat
//   this.timeSinceLastChat = Infinity;
//   this.successiveChats = 0;
//   this.banned = false;
//   this.messages = {};

  // end Player
};



Player.prototype.update = function(){
  var inputChanged = (
    this.cursor.left != this.state.input.left ||
    this.cursor.right != this.state.input.right ||
    this.cursor.up != this.state.input.up ||
    this.cursor.down != this.state.input.down
  );

  if (inputChanged){
    // send new keypresses to server
    if (this.avatar.id == myId){
      this.state.x = this.avatar.x;
      this.state.y = this.avatar.y;

      eurecaServer.handleState(this.state);
    }
  }

  if (this.cursor.left == false &&
    this.cursor.right == false &&
    this.cursor.up == false &&
    this.cursor.down == false){
    this.avatar.animations.stop();
  } else {
    this.avatar.animations.play('walk');
  }

  // actual player movement calculation
  this.avatar.body.velocity.set(0);
  if (this.cursor.up){ this.avatar.body.velocity.y = -this.moveSpeed; }
  if (this.cursor.down){ this.avatar.body.velocity.y = this.moveSpeed; }
  if (this.cursor.left){ this.avatar.body.velocity.x = -this.moveSpeed; }
  if (this.cursor.right){ this.avatar.body.velocity.x = this.moveSpeed; }

  // room nav?

  // display name position
  this.label.alignTo(this.avatar, 0.5, 0, 0, -10);

  // end Player.update()
}

Player.prototype.kill = function() {
  this.avatar.kill();
  this.label.destroy();
}


//
// Setup the main game
// note: create() subbed with eurecaClientSetup(), where we call create()
//
var game = new Phaser.Game(1024, 512, Phaser.AUTO, '', { preload: preload, create: eurecaClientSetup, update: update, render: render });

function preload() {
  game.load.spritesheet('avatar', 'assets/player.png', 32, 32);
  game.load.tilemap('map1', 'assets/1.csv');
  game.load.image('tileset','assets/tileset.png');


}

function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  map = game.add.tilemap('map1', 32, 32);
  map.addTilesetImage('tileset');
  map.setCollisionBetween(2,8);
  map.setCollisionBetween(10,14);

  layer0 = map.createLayer(0);
  layer0.resizeWorld();
  layer0.debug = true;

  player = new Player(myId, game, avatar, "Player", 1);
  players[myId] = player;
  avatar = player.avatar;
  player.avatar.x=512;
  player.avatar.y=206;

  keys = game.input.keyboard.createCursorKeys();
}


function update() {
  if (!ready) return;

  game.physics.arcade.collide(player.avatar,layer0);

  // update player movements (server processes them later)
  player.state.input.left = keys.left.isDown;
  player.state.input.right = keys.right.isDown;
  player.state.input.up = keys.up.isDown;
  player.state.input.down = keys.down.isDown;

  for (var i in players) {
    players[i].update();
  }
};



function render() {
  if (!ready) return;
  game.debug.body(player);

}
