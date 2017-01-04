var main = function(game) {
  this.game = game;
}

main.prototype = {
  create: function() {
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    setMapRoom(1, this.game);

    player = new Player(myId, this.game, avatar, "Player", 1);
    players[myId] = player;
    avatar = player.avatar;
    player.avatar.x=512;
    player.avatar.y=206;

    keys = this.game.input.keyboard.createCursorKeys();

    ready = true;
  },


  update: function() {
    if (!ready) return;

    // run collisions (note: player.avatar, not player)
    this.game.physics.arcade.collide(player.avatar, layer0);

    // update player movements (server processes them later)
    player.state.input.left = keys.left.isDown;
    player.state.input.right = keys.right.isDown;
    player.state.input.up = keys.up.isDown;
    player.state.input.down = keys.down.isDown;

    for (var i in players) {
      players[i].update();
    }
  },


  render: function() {
    //   if (!ready) return;
    //   debug.body(player);
  },
}

var eurecaServer;
var avatar;
var player;
var keys;
var maps = {};
var layer0;
var ready = false;
var players = {};
var myId;
var debug = true;
var moveSpeed = 200;

var eurecaClientSetup = function() {
  var eurecaClient = new Eureca.Client();

  eurecaClient.ready(function (proxy) {
    eurecaServer = proxy;
  });

  // "exports" methods are server-side
  eurecaClient.exports.setId = function(id){
    myId = id;
    eurecaServer.handshake();
  }

  eurecaClient.exports.kill = function(id){
    if (players[id]){
      players[id].kill();
      console.log(`killing ${id}`);
    }
  }

  eurecaClient.exports.spawnPlayer = function(id, x, y, nick, room){
    if (id == myId) return; // only spawn other players

    console.log(`PLAYER SPAWN: ${id}`);
    var plr = new Player(id, player.game, avatar, nick, room, x, y);
    players[id] = plr;
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


Room = function(id, x, y, doors){
  this.id = id;
  this.width = x;
  this.height = y;
  this.doors = doors;
  this.neighbors = Object.keys(doors);

  this.hasDoor = function(x, y){
    for (var i in this.doors){
      if (this.doors[i].x == x && this.doors[i].y == y) return true;
    }
    return false;
  }

  this.findNeighbor = function(x, y){
    // returns id of the room whose door is located at this room's tile (x,y)
    for (var i in this.doors){
      if (this.doors[i].x == x && this.doors[i].y == y) return i;
    }
    return false;
  }
}

// full world map
var room1 = new Room(1, 32, 16, {
      2: {x: 18, y: 5},
      3: {x: 8,  y: 7}
    }),
    room2 = new Room(2, 32, 16, {
      1: {x: 10,  y: 10}
    }),
    room3 = new Room(3, 32, 16, {
      1: {x: 10,  y: 10}
    });

// hash of room ids to room objects
var rooms = {
  1: room1,
  2: room2,
  3: room3
}

function enterDoor(sprite, tile){ // redo as player class method?
  // this runs whenever the player collides with a door tile
  // NOT to be confused with Player.enterRoom()
  var currentRoom = rooms[player.room];
  if (currentRoom.hasDoor(tile.x, tile.y)) {
    var nextRoom = currentRoom.findNeighbor(tile.x, tile.y);
    player.enterRoom(nextRoom, tile.x*tile.width, tile.y*tile.height);
  }
}

var defaultFont = {
  font: '16px Arial',
  fill: '#fff',
  align: 'center'
}


//
// Player class, methods
//
Player = function(index, game, avatar, nick, room, x, y){
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
    nick: nick || "Player",
    room: room || 1
  }

  var x = x || 0;
  var y = y || 0;

  this.game = game;

  // avatar
  this.avatar = this.game.add.sprite(32, 32, 'avatar', 0);
  this.avatar.animations.add('walk', [0, 1, 0, 2], 10, true);
  game.physics.enable(this.avatar, Phaser.Physics.ARCADE);
  this.avatar.body.setSize(16, 32, 8, 0);
  this.avatar.body.collideWorldBounds = true;
  this.avatar.id = index;

  // default stats
  this.moveSpeed = moveSpeed;

  // username
  this.nick = nick;
  this.label = this.game.add.text(0, 0, this.state.nick, defaultFont);
  this.label.anchor.set(0.5);
  this.label.alignTo = function(sprite, pct_x, pct_y, pad_x, pad_y){
    this.x = Math.floor(sprite.x + (pct_x*sprite.width) + pad_x);
    this.y = Math.floor(sprite.y + (pct_y*sprite.height) + pad_y);
  }

  this.setNick = function(text) {
    this.nick = this.state.nick = this.label.text = text.slice(0,20);
  }


  // navigation
  this.room = room || 1;
  this.enterRoom = function(id, x, y){
    // NOT to be confused with top level function enterDoor
    if (rooms[id] && rooms[this.room].neighbors.indexOf(id) != -1){
      setMapRoom(id, game);
      this.avatar.bringToTop();
      this.label.bringToTop();
      this.room = id;
    }
  }

  // chat
  //   this.timeSinceLastChat = Infinity;
  //   this.successiveChats = 0;
  //   this.banned = false;
  //   this.messages = {};

  // end Player
};

function setMapRoom(id, game){
    maps[id] = game.add.tilemap(`map${id}`, 32, 32);
    maps[id].addTilesetImage(`Room${id}`, 'tileset');
    maps[id].setCollisionBetween(3,9);
    maps[id].setCollisionBetween(11,15);
    maps[id].setTileIndexCallback(10, enterDoor, this); // makes door tiles work

    if (layer0) layer0.destroy();
    layer0 = maps[id].createLayer(0);
    layer0.resizeWorld();
    if (debug) layer0.debug = true;
}


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

  // display name position
  this.label.alignTo(this.avatar, 0.5, 0, 0, -10);

  // end Player.update()
}

Player.prototype.kill = function() {
  this.avatar.kill();
  this.label.destroy();
}


//
// begin server
//
eurecaClientSetup();
