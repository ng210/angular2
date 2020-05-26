include('iadapter.js');
/******************************************************************************
 * Adapter interface extensions for editor
 ******************************************************************************/
(function() {
    IAdapterExt = {
        // data handling extensions
        makeCommand: function(command) { throw new Error('Not implemented!'); },
        //getCommandSize: function(command, args) { throw new Error('Not implemented!'); },
        toDataSeries: function(sequence, getSeriesId, convertCommand) {
            var series = {};
            var stream = sequence.stream;
            stream.readPosition = sequence.headerSizeInBytes;
            var delta = 0;
            while (stream.readPosition < stream.length) {
                delta += stream.readUint16();
                var cmd = 0;
                while (stream.readPosition < stream.length) {
                    // read command code, 1 byte
                    cmd = stream.readUint8();
                    if (cmd == Ps.Player.EOF) break;
                    if (cmd == Ps.Player.EOS) {
                        series[cmd] = ds = new DataSeries();
                        ds.set([delta, 0]);
                        break;
                    }
                    var seriesId = getSeriesId(cmd, stream);
                    var ds = series[seriesId];
                    if (!ds) {
                        ds = series[seriesId] = new DataSeries();
                        // if (cmd == psynth.SynthAdapter.SETNOTE && !series[psynth.SynthAdapter.SETVELOCITY]) {
                        //     series[psynth.SynthAdapter.SETVELOCITY] = new DataSeries();
                        // }
                    }
                    convertCommand(cmd, delta, stream, ds);
                }
                if (cmd == Ps.Player.EOS) {
                    break;
                }
            }
            return series;
        },
        fromDataSeries: function(series, adapter, channelId) {
            var sequence = null;
            var keys = Object.keys(series);
            var f0 = 0, f1 = 0;
            var noteMap = {};
            var isEnd = false;
            var lastWrite = -1;
            var info = [];
            do {
                for (var k=0; k<keys.length; k++) {
                    var key = parseInt(keys[k]);
                    var ds = series[key];
                    if (ds.data.length == 0) continue;
                    if (info[k] == undefined) {
                        info[k] = ds.getInfo();
                    }
                    if (key == Ps.Player.EOS) {
                        isEnd = (f0 == info[k].max[0]);
                        continue;
                    }
                    if (channelId != undefined && channelId != k) continue;

                    if (key == psynth.SynthAdapter.SETVELOCITY) continue;

                    if (info[k].max[0] >= f0) {
                        var dataPoints = ds.get(f0);
                        for (var i=0; i<dataPoints.length; i++) {
                            if (sequence == null) {
                                sequence = new Ps.Sequence(adapter);
                                sequence.writeHeader();
                            }
                            // write delta
                            sequence.writeDelta(f0 - f1);
                            // make and write command
                            var dataPoint = Array.from(dataPoints[i]);
                            dataPoint[0] = key == psynth.SynthAdapter.SETNOTE ? key : psynth.SynthAdapter.SETCTRL8;
                            var cmd = sequence.adapter.makeCommand.apply(null, dataPoint);
                            sequence.stream.writeStream(cmd);
                            noteMap[dataPoint[1]] = f0 + dataPoint[3];
                        }
                    }
                }
                sequence = sequence || new Ps.Sequence(adapter);
                for (var n in noteMap) {
                    if (noteMap[n] == f0) {
                        if (lastWrite == sequence.cursor) {
                            sequence.writeDelta(f0 - f1);
                        }
                        sequence.writeCommand(psynth.SynthAdapter.SETNOTE);
                        sequence.stream.writeUint8(parseInt(n));
                        sequence.stream.writeUint8(0);
                        noteMap[n] = undefined;
                    }
                }
                if (isEnd) {
                    if (lastWrite == sequence.cursor) {
                        sequence.writeDelta(f0 - f1);
                    }
                    sequence.writeCommand(Ps.Player.EOS);
                    break;
                }
                if (lastWrite != sequence.cursor) {
                    sequence.writeEOF();
                    lastWrite = sequence.cursor;
                    f1 = f0;
                }
                f0++;
            } while (true);
            return sequence;
        },
        createInitData: function() {
            return null;
        },

        // UI extensions
        createDialog: function(type) { throw new Error('Not implemented!'); },
        createDeviceUi: function(device) { throw new Error('Not implemented!'); },
        createSequenceUi: function(device) { throw new Error('Not implemented!'); }
    };        

    public(IAdapterExt, 'IAdapterExt', Ps);
})();
