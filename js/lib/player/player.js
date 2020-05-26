include('iadapter.js');
(function () {
    function Player() {
        this.sequences = [];
        this.userDataBlocks = [];
        this.refreshRate = 25.0;
    };
    extend(Ps.IAdapter, Player);

    Player.prototype.addAdapter = function (adapter) {
        Player.adapters[adapter.getInfo().id] = adapter;
    };

    Player.EOF = 0;
    Player.EOS = 1;
    Player.ASSIGN = 2;
    Player.TEMPO = 3;

    // IAdapter implementation
    Player.prototype.getInfo = function () { return Player.info; };

    Player.prototype.prepareContext = function (data) {
    // #00 device count
    // #01 type of device #0
    // #02 type of device #1
    // ...
    // #0n type of device #n-1
        console.log('Player.prepareContext');
        Player.base.prepareContext.call(this, data);
    };

    Player.prototype.createDevice = function (deviceType, initData) {
        var device = null;
        switch (deviceType) {
            case Ps.Player.Device.PLAYER:
                device = new Ps.Player();
                break;
            case Ps.Player.Device.CHANNEL:
                device = new Ps.Channel(this.devices.length, this.devices[0]);
                break;
        }
        if (device != null) {
            device.type = deviceType;
            this.devices.push(device);
        }
        return device;
    };

    Player.prototype.processCommand = function (device, command, sequence, cursor) {
        switch (command) {
            case Player.ASSIGN:
                var deviceId = sequence.getUint8(cursor++);
                var sequenceId = sequence.getUint8(cursor++);
                var sequence = this.sequences[sequenceId];
                device.assign(deviceId, sequence);
                break;
            case Player.TEMPO:
                for (var i in Player.adapters) {
                    var adapter = Player.adapters[i];
                    if (typeof adapter.updateRefreshRate === 'function') {
                        adapter.updateRefreshRate(sequence.readFloat32(cursor++));
                    }
                }
                break;
        }
        return cursor;
    };

    Player.prototype.updateRefreshRate = function(fps) {
        console.log('Player.updateRefreshRate to ' + fps.toPrecision(4));
    };

    // static members
    Player.adapters = {};

    Player.info = {
	    name: 'PlayerAdapter',
	    id: 0
    };
    
    Player.Device = {
        PLAYER: 0,
        CHANNEL: 1
    };

    public(Player, 'Player', Ps);
})();