include('/ge/player/player.js');
include('/ge/stream.js');

(function() {
    // byte streams
    // - commands: code, byte count, arguments
    // - frames: delta, command-1, command-2, ..., command-n, 0
    // - sequence: header byte count, header, frame-1, frame-2, ..., frame-n, EOS frame

    var Sequence = function(adapterId) {
        this.stream = new Stream(256);
        this.headerSizeInBytes = 2;
        this.adapterId = adapterId;
        Object.defineProperties(this, {
            'cursor': {
                'enumerable': true,
                set(v) { this.stream.cursor = v; },
                get() { return this.stream.cursor; }
            },
        });

        this.constructor = Player.Sequence;
    };

    Sequence.prototype.writeHeader = function() {
        this.cursor = 0;
        this.stream.writeUint8(this.headerSizeInBytes);
        this.stream.writeUint8(this.adapterId);
    };

    Sequence.prototype.writeDelta = function(delta) {
        this.stream.writeUint16(delta);
    };

    Sequence.prototype.writeCommand = function(cmd) {
        this.stream.writeUint8(cmd);
    };

    Sequence.prototype.writeEOF = function() {
        this.stream.writeUint8(0);
    };

    Sequence.prototype.writeEOS = function() {
        this.stream.writeUint8(1);
    };

    Sequence.prototype.writeString = function(str) {
        this.stream.writeString(str);
    };

    Sequence.prototype.writeUint8 = function(value) {
        this.stream.writeUint8(value);
    };

    Sequence.prototype.writeUint16 = function(value) {
        this.stream.writeUint16(value);
    };

    Sequence.prototype.writeUint32 = function(value) {
        this.stream.writeUint32(value);
    };

    Sequence.prototype.writeFloat32 = function(value) {
        this.stream.writeFloat32(value);
    };
        

    Sequence.prototype.getUint8 = function(offs) { return this.stream.readUint8(offs); };

    Sequence.prototype.getUint16 = function(offs) { return this.stream.readUint16(offs); };

    Sequence.prototype.getUint32 = function(offs) { return this.stream.readUint32(offs); };

    Sequence.prototype.getFloat32 = function(offs) { return this.stream.readFloat32(offs); };
    
    Player.Sequence = Sequence;
})();