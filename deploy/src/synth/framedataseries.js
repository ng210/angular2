include('/ui/idataseries.js');

(function() {

    function FrameDataSeries(sequence, adapter) {
        IDataSeries.call(this, sequence);
        this.adapter = adapter;

        this.constructor = FrameDataSeries;
    }
    FrameDataSeries.prototype = new IDataSeries;

    FrameDataSeries.prototype.getRange = function(seriesId, start, length, data) {
        var info = this.seekFrame(start);
        var end = start+length;
        var range = { count: 0, max: info.delta };
        for (var i=info.ix; range.max<end && i<this.data.length; i++) {
            var frame = this.data[i];
            if (frame) {
                range.max += frame.delta;
                var cmdInfo = this.seekCommand(frame, seriesId);
                if (cmdInfo.command) {
                    if (data) {
                        data.push(range.max, cmdInfo.command.readUint8(1));      // read first parameter
                    }
                    range.count++;
                }
            } else {
                range.max++;
            }
        }
        return range;
    };

    FrameDataSeries.prototype.seekFrame = function(pos) {
        var frames = this.data;
        var result = { delta: 0, ix: -1, frame: null };
        for (var i=0; i<frames.length; i++) {
            result.delta += frames[i].delta;
            if (result.delta >= pos) {
                result.ix = i;
                result.frame = frames[i];
                break;
            }
        }
        return result;
    };

    FrameDataSeries.prototype.seekCommand = function(frame, cmd) {
        var result = { command: null, ix: -1 };
        for (var i=0; i<frame.commands.length; i++) {
            if (frame.commands[i].readUint8(0) == cmd) {
                result.command = frame.commands[i];
                result.ix = i;
                break;
            }
        }
        return result;
    };

    FrameDataSeries.prototype.set = function(cmdId, ix, value) {
        var info = this.seekFrame(ix);
        if (!info.frame) {
            // get preceding frame
            var info = this.seekFrame(ix - 1);
            // insert new frame
            var frame = new Player.Frame();
            // absolute or relative to preceding
            frame.delta = info.ix == -1 ? ix : ix - info.frame.delta;
            // create new command
            var command = this.adapter.makeCommand(cmdId, value, 127);
            frame.commands.push(command);
        } else {
            // get matching command at frame
            info = this.seekCommand(info.frame, cmdId);
            if (info.ix != -1) {
                // modify command
                info.command.cursor = 0;
                var command = this.adapter.makeCommand(cmdId, value, info.command.readUint8(2));
                info.command.writeStream(command, 0);
            } else {
                // create new command
                var command = this.adapter.makeCommand(cmdId, value, 127);
                frame.commands.push(command);
            }
        }
    };

    FrameDataSeries.prototype.get = function(cmdId, ix) {
        var info = this.seekFrame(ix);
        var value = null;
        if (info.frame) {
            var info = this.seekCommand(frame, cmdId);
            value = info.command;
        }
        return value;
    };

    public(FrameDataSeries, 'FrameDataSeries');
})();