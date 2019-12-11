include('/ge/player/iadapter.js');
include('/ge/player/channel.js');

(function() {
    var player = function() {
        this.adapters = {};
        this.sequences = [];
        this.userDataBlocks = [];
        this.targets = [];
        this.channels = [];
        this.refreshRate = 25.0;
        this.constructor = Player.Player;
    };
    player.prototype.xxx = function() {

    };

    public(player, 'Player');
})();