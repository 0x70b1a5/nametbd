var boot = function(game){
  console.log("%cdeath comes for us all", "color:red; background:black");
}

boot.prototype = {
  preload: function() {
    this.game.load.image("logo","assets/logo.png");
    this.game.load.image("lbar","assets/lbar.png");
  },

  create: function() {
//     this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
//     this.scale.pageAlignHorizontally = true;
//     this.scale.setScreenSize();
    this.game.state.start("preload");
  }
}
