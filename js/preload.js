var preload = function(game){}

preload.prototype = {
  preload: function(){
    var loadBar = this.add.sprite(512, 206, "lbar");
    loadBar.anchor.setTo(0.5, 0.5);
    this.load.setPreloadSprite(loadBar);

    this.game.load.spritesheet('avatar', 'assets/player.png', 32, 32);
    this.game.load.tilemap('map1', 'assets/map.json', null, Phaser.Tilemap.TILED_JSON);
    this.game.load.tilemap('map2', 'assets/2.json', null, Phaser.Tilemap.TILED_JSON);
    this.game.load.tilemap('map3', 'assets/3.json', null, Phaser.Tilemap.TILED_JSON);
    this.game.load.image('tileset','assets/tileset.png');
    this.game.load.image('playbtn','assets/playbtn.png');
  },

  create: function(){
    this.game.state.start("title");
  }
}
