include('player/iadapter-ext.js');
include('player/player.js');
include('data/dataseries.js');
include('data/stream.js');
include('/synth/synth-adapter.js');
include('ui/ui-lib.js');

// Extensions to the synth-adapter
(function() {
    Ps.Player.prototype.makeCommand = function(command) {
        var stream = new Stream(128);
        stream.writeUint8(command);
        switch (command) {
            case Ps.Player.ASSIGN:
                if (arguments[1] instanceof Ps.Sequence) {
                    stream.writeStream(arguments[1].stream, arguments[2], 3);
                } else {
                    stream.writeUint8(arguments[1]);
                    stream.writeUint8(arguments[2]);
                    stream.writeUint8(arguments[3]);
                }
                break;
            case Ps.Player.TEMPO:
                if (arguments[1] instanceof Ps.Sequence) {
                    stream.writeStream(arguments[1].stream, arguments[2], 2);
                } else {
                    stream.writeUint8(arguments[1]);
                    stream.writeUint8(arguments[2]);
                }
                break;
        }
        return new Stream(stream);
    };

    Ps.Player.prototype.toDataSeries = function(sequence) {
        var noteMap = {};
        return Ps.IAdapterExt.toDataSeries.call(this, sequence,
            (cmd, stream, cursor) => cmd,
            (cmd, delta, stream, cursor, ds) => {
                switch (cmd) {
                    case Ps.Player.ASSIGN:
                        var device = stream.readUint8(cursor++);
                        var sequence = stream.readUint8(cursor++);
                        ds.set(delta, stream.readUint8([delta, device, sequence]));
                        break;
                    case Ps.Player.TEMPO:
                        ds.set(delta, stream.readUint8(cursor++));
                        break;
                    default:
                        throw new Error(`Unsupported command #${cmd}`);
                }
                return cursor;
            }
        );
    };

    Ps.Player.prototype.fromDataSeries = function(series, channelId) {
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
                if (key == psynth.SynthAdapter.SETVELOCITY) continue;
                if (channelId != undefined && channelId != k) continue;
                if (info[k].max[0] >= f0) {
                    var dataPoints = ds.get(f0);
                    for (var i=0; i<dataPoints.length; i++) {
                        if (sequence == null) {
                            sequence = new Ps.Sequence(psynth.SynthAdapter);
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
            sequence = sequence || new Ps.Sequence(psynth.SynthAdapter);
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
    };

    Ps.Player.prototype.createDialog = function(type) {
        var ui = null;
        switch (type) {
            case 'device': ui = new NewDevice(); break;
            case 'sequence': ui = new NewSequence(); break;
            default: throw new Error(`Invalid dialog type ${type}!`);
        }
        return ui;
    };
    
    Ps.Player.prototype.createDeviceUi = function(device) {
        var template = {
            'titlebar': 'Player',
            'layout': Ui.Container.Layout.Free,
            'items': {
                'bpm': { type:'pot', value: 100 }
            },
            'data-source': device
        };
        var ui = new Ui.Board(device.id, template, null);
        ui.addClass('player');
        return ui;
    };

    Ps.Player.prototype.createSequenceUi = function(sequence) {
        var template = {
            'titlebar': 'Player',
            'layout': Ui.Container.Layout.Free
        };
        return new Ui.Board(sequence.id, template, null);
    };

    /* Dialogs ***************************************************************/
    function NewDevice() {
        Ui.Board.call(this, 'new-device', {
            "titlebar": false,
            "items": {
                "type": { "label": "Device type", "type": "ddlist", "item-key": false, "item-value": "$key" }
            }
        });
        this.items.type.setItems( ['Channel'] );
    }
    extend(Ui.Board, NewDevice);
    NewDevice.prototype.onchange = function(e) {
    };

    function NewSequence() {
        Ui.Board.call(this, 'new-sequence', {
            "titlebar": false,
            "items": {
                "type": { "label": "Type", "type": "ddlist" }
            }
        });
        this.items.type.setItems( Ps.Player.Device );
    }
    extend(Ui.Board, NewSequence);
    NewDevice.prototype.onclick = function(e) {
        console.log('Hello ' + e.control.id);
    }

})();