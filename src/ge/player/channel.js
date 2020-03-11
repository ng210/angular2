include('/ge/player/sequence.js');

(function(){
    var frame = function() {
        this.delta = 0;
        this.commands = [];
        
    };
    Player.Frame = frame;

    var channel = function(id, player) {
        this.id = id;
        this.player = player;
        this.sequence = null;
        this.frames = null;
        this.target = null;
        this.adapter = null;
        this.isActive = false;
        this.currentTick = 0;
        this.loopCount = 0;
        this.cursor = 0;

        
    };

    channel.prototype.assign = function(target, sequence) {
        this.sequence = sequence;
        this.cursor = sequence.headerSizeInBytes;
        this.target = target;
        this.adapter = sequence.adapter;
        if (!this.adapter) {
            throw new Error(`Missing adapter!`);
        }
    };

    channel.prototype.reset = function() {
        this.cursor = this.sequence.headerSizeInBytes;
        if (this.loopCount > 0) {
            this.currentTick = 0;
            this.loopCount--;
            this.isActive = true;
        } else {
            this.isActive = false;
        }
    };

    channel.prototype.run = function(ticks) {
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
                        this.cursor = this.adapter.processCommand(this.target, cmd, this.sequence, this.cursor);
                    } else {
                        if (cmd === 1) {
                            // end of sequence
                            this.reset();
                            isRestarted = this.isActive;
                        }
                        // cmd == 0: end of frame
                        break;
                    }
                }
                if (cmd === 1) {
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

    channel.prototype.toFrames = function() {
        this.frames = this.sequence.toFrames();
        return this.frames;
    };

    channel.prototype.toSequence = function() {
        this.sequence = new Player.Sequence(this.adapter);
        this.sequence.fromFrames(this.frames);
        return this.sequence;
    };

    Player.Channel = channel;
})();