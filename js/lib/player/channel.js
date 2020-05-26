include('sequence.js');

(function(){
    function Frame() {
        this.delta = 0;
        this.commands = [];
        
    };
    public(Frame, 'Frame', Ps)
    //Ps.Frame = Frame;

    function Channel(id, player) {
        this.id = id;
        this.player = player;
        this.sequence = null;
        this.frames = null;
        this.device = null;
        this.adapter = null;
        this.isActive = false;
        this.currentTick = 0;
        this.loopCount = 0;
        this.cursor = 0;
    };

    Channel.prototype.assign = function(deviceId, sequence) {
        this.sequence = sequence;
        this.cursor = sequence.headerSizeInBytes;
        this.adapter = sequence.adapter;
        if (!this.adapter) {
            throw new Error(`Missing adapter!`);
        }
        this.device = this.adapter.getDevice(deviceId);
    };

    Channel.prototype.reset = function() {
        this.cursor = this.sequence.headerSizeInBytes;
        if (this.loopCount > 0) {
            this.currentTick = 0;
            this.loopCount--;
            this.isActive = true;
        } else {
            this.isActive = false;
        }
    };

    Channel.prototype.run = function(ticks) {
        var isRestarted = false;
        while (this.isActive) {
            isRestarted = false;
            var delta = 0;
            while ((delta = this.sequence.getUint16(this.cursor)) <= this.currentTick) {
                this.currentTick -= delta; this.cursor += 2;
                while (true) {
                    // read command code, 1 byte
                    var cmd = this.sequence.getUint8(this.cursor++);
                    if (cmd > 1) {
                        this.cursor = this.adapter.processCommand(this.device, cmd, this.sequence, this.cursor);
                    } else {
                        if (cmd === Ps.Player.EOS) {
                            // end of sequence
                            this.reset();
                            isRestarted = this.isActive;
                        }
                        // cmd == 0: end of frame
                        break;
                    }
                }
                if (cmd === Ps.Player.EOS) {
                    // end of sequence
                    break;
                }
            }
            if (isRestarted) {
                // end of sequence
                continue;
            }
            this.currentTick += ticks;
            break;
        }
        return this.isActive;
    };

    Channel.prototype.toFrames = function() {
        this.frames = this.sequence.toFrames();
        return this.frames;
    };

    Channel.prototype.toSequence = function() {
        this.sequence = new Ps.Sequence(this.adapter);
        this.sequence.fromFrames(this.frames);
        return this.sequence;
    };

    public(Channel, 'Channel', Ps)
})();