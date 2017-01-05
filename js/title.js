var title = function(game) {}

title.prototype = {
  preload: function(){
    var title = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, "logo");
    title.anchor.setTo(0.5, 0.5);
    var playBtn = this.game.add.button(this.game.world.centerX - 33, this.game.world.centerY + 50, "playbtn", this.play, this);
  },

  play: function() {
    this.game.state.start("main");
    $("#main").show();
  }
}
