include('/ge/player/sequence.js');

(function(){
    var frame = function() {
        this.delta = 0;
        this.commands = [];
        this.constructor = Player.Frame;
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

        this.constructor = Player.Channel;
    };

    channel.prototype.assign = function(target, sequence) {
        this.sequence = sequence;
        this.cursor = sequence.headerSizeInBytes;
        this.target = target;
        this.adapter = this.player.adapters[sequence.adapterId];
        if (this.adapter === undefined) {
            throw new Error(`Unsupported adapter type ${sequence.adapterId}`);
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
        while (true) {
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
        this.frames = [];
        var cursor = this.sequence.headerSizeInBytes;
        while (true) {
            var frame = new Player.Frame();
            frame.delta = this.sequence.getUint16(cursor); cursor += 2;
            var cmd = 0;
            while (true) {
                // read command code, 1 byte
                cmd = this.sequence.getUint8(cursor++);
                if (cmd > 1) {
                    // var oldCursor = cursor;
                    // cursor += this.adapter.getCommandSize(cmd-2, this.sequence, cursor+1);
                    // frame.commands.push(new DataView(this.sequence.stream.slice(oldCursor, cursor)));
                    var command = this.adapter.makeCommand(cmd, this.sequence, cursor);
                    frame.commands.push(command);
                    cursor += command.length - 1;
                } else if (cmd == 0) {
                    if (frame.commands.length == 0) {
                        cmd = new Stream(1);
                        cmd.writeUint8(0);
                        frame.commands.push(cmd);
                    }
                    break;
                } else if (cmd == 1) {
                    break;
                }
            }
            this.frames.push(frame);
            if (cmd === 1) {
                break;
            }
        }
    };

    channel.prototype.toStream = function() {
        var sequence = new Player.Sequence(this.sequence.adapterId);
        var hasEOS = false;
        sequence.writeHeader();
        for (var fi=0; fi<this.frames.length; fi++) {
            var frame = this.frames[fi];
            var hasEOF = false;
            sequence.writeDelta(frame.delta);
            for (var ci=0; ci<frame.commands.length; ci++) {
                var command = frame.commands[ci];
                sequence.stream.writeStream(command, 0);
                var cmd = command.readUint8(0);                
                if (cmd == 0) {
                    hasEOF = true;
                    break;
                }
                if (cmd == 1) {
                    hasEOS = true;
                    break;
                }
            }
            //if (hasEOS) break;
            if (!hasEOF) {
                sequence.writeUint8(0);
            }
        }
        sequence.cursor--;
        if (!hasEOS) {
            sequence.writeUint8(1);
        }
        this.sequence = sequence;
        return sequence;
    };

    Player.Channel = channel;
})();