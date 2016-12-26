var title = function(game) {}

title.prototype = {
  preload: function(){
    var title = this.game.add.sprite(512, 206, "logo");
    title.anchor.setTo(0.5, 0.5);
    var playBtn = this.game.add.button(500, 300, "playbtn", this.play, this);
  },

  play: function() {
    this.game.state.start("main");
  }
}
