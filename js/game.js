
var eurecaServer;
var avatar;
var player;
var moveSpeed = 2;
var keys;
var map;
var layer0;
var ready = false;
var players = {};
var chatBox;
var enterCooldown = 0;

var defaultFont = {
  font: '16px Arial',
  fill: '#fff',
  align: 'center'
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
    if (players[id].state.chatlog != state.chatlog){
      players[id].state.chatlog = state.chatlog;
    }

    players[id].update();
  }
}

//
// Player class, methods
//
Player = function(index, game, avatar, nick){
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
    chatlog: {}
  }

  var x = 0;
  var y = 0;

  this.game = game;

  // avatar
  this.avatar = game.add.sprite(32, 32, 'avatar');
  game.add.existing(this.avatar); // you have to do this
  this.avatar.animations.add('walk', [0, 1, 0, 2], 10, true);
  this.avatar.id = index;
  game.physics.enable(this.avatar, Phaser.Physics.ARCADE);
  this.avatar.immovable = false;
  this.avatar.collideWorldBounds = true;

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

  // chat
  this.timeSinceLastChat = Infinity;
  this.successiveChats = 0;
  this.banned = false;
  this.messages = {};
  this.sendMessage = function(text){
    if (text.trim() == '') return;

    var msg = new Message(text, this);
    if (typeof(msg) == Number) {
      return `Chat error: ${msg}`; // TODO put errors in chatlog
    }

    console.log(`${this.nick}: ${msg.text}`);

    this.state.chatlog[msg.time] = msg;
  }

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

  // display name position
  this.label.alignTo(this.avatar, 0.5, 0, 0, -10);

  // chat calculations
  this.timeSinceLastChat += Date.now() - this.timeSinceLastChat;

  // end Player.update()
}

Player.prototype.kill = function() {
  this.avatar.kill();
  this.label.destroy();
}

//
// GUI
//
var menuScreen;
var gameScreen;
var settingsScreen;

function setupGUI() {
  EZGUI.components.playBtn.on('click', function() {
    gameScreen.visible = true;
    menuScreen.visible = false;
    ready = true;
  });

  EZGUI.components.quitBtn.on('click', function() {
    gameScreen.visible = false;
    menuScreen.visible = true;
    ready = false;
  });

  EZGUI.components.settingsBtn.on('click', function() {
    gameScreen.visible = false;
    EZGUI.components.nickField.text = player.nick; // prefill
    settingsScreen.visible = true;
  });

  EZGUI.components.closeSettingsBtn.on('click', function() {
    settingsScreen.visible = false;
    gameScreen.visible = true;
  });

  EZGUI.components.nickBtn.on('click', function(){
    player.setNick(EZGUI.components.nickField.text);
  });
}

EZGUI.Theme.load(['../EZGUI/assets/metalworks-theme/metalworks-theme.json'], function() {
  menuScreen = EZGUI.create(menuScreenJSON, 'metalworks');
  menuScreen.visible = true;

  gameScreen = EZGUI.create(gameScreenJSON, 'metalworks');
  gameScreen.visible = false;

  settingsScreen = EZGUI.create(settingsScreenJSON, 'metalworks');
  settingsScreen.visible = false;

  setupGUI();
});

//
// Chat system
//
Message = function(text, player){
  if (!player) return 1;
  if (player.banned) return 2;
  if (player.timeSinceLastChat < 10000 && player.successiveChats > 3) return 3;
  if (text == '') return 4;

  this.text = text//.slice(0,500); // TODO: decide on (or remove) magic number
  this.time = Date.now();

  player.timeSinceLastChat = 0;
  player.successiveChats++;
}

function openChatBox(){
  if (chatBox && chatBox.open) return;

  console.log("OPENING CHATBOX");

  chatBox = game.add.inputField(10, 480, {
    font: '16px Arial',
    fill: '#fff',
    backgroundColor: '#000',
    cursorColor: '#fff',
    width: 800,
    height: 25,
    padding: 2,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 0,
    placeHolder: 'Type a message to chat...',
    max: 500
  });

  chatBox.open = true;

  // PhaserInput method for autofocus
  //chatBox.value = '';
  //chatBox.startFocus();
  // TODO figure this out
}

function closeChatBox(){
  if (chatBox && !chatBox.open) return;
  chatBox.open = false;

  console.log("CLOSING CHATBOX");

  chatBox.destroy();
}

//
// Setup the main game
// note: create() subbed with eurecaClientSetup(), where we call create()
//
var game = new Phaser.Game(1024, 512, Phaser.AUTO, '', { preload: preload, create: eurecaClientSetup, update: update, render: render });

function preload() {
  game.load.spritesheet('avatar', 'assets/player.png', 32, 32);
  game.load.tilemap('map', 'assets/map.csv');
  game.load.image('tileset','assets/tileset.png');

  game.add.plugin(Fabrique.Plugins.InputField);
}

function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  map = game.add.tilemap('map', 32, 32);
  map.addTilesetImage('tileset');

  layer0 = map.createLayer(0);
  layer0.resizeWorld();

  player = new Player(myId, game, avatar, "Player");
  players[myId] = player;
  avatar = player.avatar;
  player.avatar.x=0;
  player.avatar.y=game.world.height*Math.random();

  keys = game.input.keyboard.createCursorKeys();
  keys.enter = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
}


function update() {
  if (!ready) return;

  // update player movements (server processes them later)
  player.state.input.left = keys.left.isDown;
  player.state.input.right = keys.right.isDown;
  player.state.input.up = keys.up.isDown;
  player.state.input.down = keys.down.isDown;

  if (keys.enter.isDown && enterCooldown > 50){
    if (chatBox && chatBox.open){
      player.sendMessage(chatBox.text.text, players);
      closeChatBox();
    } else if (!chatBox || chatBox && !chatBox.open) {
      openChatBox();
    }
    enterCooldown = 0;
  }
  enterCooldown++;

  for (var i in players) {
    players[i].update();
  }
};



function render() {}
