(function() {
    function ensureSize(stream, additionalBytes) {
        var newSize = stream.writePosition + additionalBytes;
        if (stream.size < newSize) {
            var buffer = new Uint8Array(newSize);
            for (var i=0; i<stream.buffer.byteLength; i++) {
                buffer[i] = stream.view.getUint8(i);
            }
            stream.buffer = buffer.buffer;
            stream.view = new DataView(stream.buffer);
        }
    }

    function Stream(arg) {
        if (typeof arg === 'number') {
            this.buffer = new ArrayBuffer(arg);
        } else if (arg instanceof Stream) {
            this.buffer = new Uint8Array(arg.buffer).slice(0, arg.length).buffer;
        } else if (arg instanceof ArrayBuffer) {
            this.buffer = arg;
        } else if (arg.buffer && arg.buffer instanceof ArrayBuffer) {
            this.buffer = new Uint8Array(arg.buffer).buffer;
        } else {
            throw new Error('Invalid argument!');
        }
        this.length = 0;
        this.readPosition = 0;
        this.writePosition = 0;
        this.view = new DataView(this.buffer);
    }
    Stream.prototype = {
        get size() { return this.buffer.byteLength; },
        constructor: Stream
    };
    Stream.prototype.writeString = function(str) {
        ensureSize(this, str.length+1);
        for (var i=0; i<str.length; i++) {
            this.view.setUint8(this.writePosition++, str.charCodeAt(i));
        }
        this.view.setUint8(this.writePosition++, 0);
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
    };

    Stream.prototype.writeStream = function(stream, offset, length) {
        offset = offset || 0;
        var byteCount = length || stream.length - offset;
        ensureSize(this, byteCount);
        for (var i=offset; i<offset+byteCount; i++) {
            this.view.setUint8(this.writePosition++, stream.readUint8(i));
        }
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
    };

    Stream.prototype.writeBytes = function(array, offset, length) {
        var byteCount = length || array.length - offset;
        ensureSize(this, byteCount);
        for (var i=offset; i<offset+byteCount; i++) {
            this.view.setUint8(this.writePosition++, array[i]);
        }
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
    };

    Stream.prototype.writeUint8 = function(value) {
        ensureSize(this, 4);
        this.view.setUint8(this.writePosition++, value);
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
    };

    Stream.prototype.writeUint16 = function(value) {
        ensureSize(this, 8);
        this.view.setUint16(this.writePosition, value);
        this.writePosition += 2;
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
    };

    Stream.prototype.writeUint32 = function(value) {
        ensureSize(this, 16);
        this.view.setUint32(this.writePosition, value);
        this.writePosition += 4;
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
    };

    Stream.prototype.writeFloat32 = function(value) {
        ensureSize(this, 16);
        this.view.setFloat32(this.writePosition, value);
        this.writePosition += 4;
        if (this.writePosition > this.length) {
            this.length = this.writePosition;
        }
    };

    Stream.prototype.readString = function(pos) {
        this.readPosition = pos || this.readPosition;
        var str = [];
        var value = 0;
        while ((value = this.view.getUint8(this.readPosition++)) != 0) {
            str.push(String.fromCharCode(value));
        }
        return str.join('');
    };

    Stream.prototype.readUint8 = function(pos) {
        this.readPosition = pos || this.readPosition;
        return this.view.getUint8(this.readPosition++);
    };

    Stream.prototype.readUint16 = function(pos) {
        this.readPosition = pos || this.readPosition;
        var r = this.readPosition;
        this.readPosition += 2;
        return this.view.getUint16(r);
    };

    Stream.prototype.readUint32 = function(pos) {
        this.readPosition = pos || this.readPosition;
        var r = this.readPosition;
        this.readPosition += 4;
        return this.view.getUint32(r);
    };

    Stream.prototype.readFloat32 = function(pos) {
        this.readPosition = pos || this.readPosition;
        var r = this.readPosition;
        this.readPosition += 4;
        return this.view.getFloat32(r);
    };

    public(Stream, 'Stream');
})();
