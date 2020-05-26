include('/ge/player/iadapter-ext.js');
include('/data/dataseries.js');
include('/data/stream.js');
include('/synth/synth-adapter.js');
include('/lib/ui/ui-lib.js');

// Extensions to the synth-adapter
(function() {
    psynth.SynthAdapter.prototype.makeCommand = function(command) {
        var stream = new Stream(128);
        stream.writeUint8(command);
        switch (command) {
            case psynth.SynthAdapter.SETNOTE:
                if (arguments[1] instanceof Ps.Sequence) {
                    stream.writeStream(arguments[1].stream, arguments[2], 2);
                } else {
                    stream.writeUint8(arguments[1]);
                    stream.writeUint8(arguments[2]);
                }
                break;
            case psynth.SynthAdapter.SETCTRL8:
                if (arguments[1] instanceof Ps.Sequence) {
                    stream.writeStream(arguments[1].stream, arguments[2], 2);
                } else {
                    stream.writeUint8(arguments[1]);
                    stream.writeUint8(arguments[2]);
                }
                break;
            case psynth.SynthAdapter.SETCTRL16:
                if (arguments[1] instanceof Ps.Sequence) {
                    stream.writeStream(arguments[1].stream, arguments[2], 3);
                } else {
                    stream.writeUint8(arguments[1]);
                    stream.writeUint16(arguments[2]);
                }
                break;
            case psynth.SynthAdapter.SETCTRLF:
                if (arguments[1] instanceof Ps.Sequence) {
                    stream.writeStream(arguments[1].stream, arguments[2], 5);
                } else {
                    stream.writeUint8(arguments[1]);
                    stream.writeFloat32(arguments[2]);
                }
                break;
        }
        return new Stream(stream);
    };

    psynth.SynthAdapter.prototype.toDataSeries = function(sequence) {
        var noteMap = {};
        return Ps.IAdapterExt.toDataSeries.call(this, sequence,
            (cmd, stream) => cmd == psynth.SynthAdapter.SETNOTE ? cmd : stream.readUint8(),
            (cmd, delta, stream, ds) => {
                switch (cmd) {
                    case psynth.SynthAdapter.SETNOTE:
                        var pitch = stream.readUint8();
                        var velocity = stream.readUint8();
                        if (velocity != 0) {
                            // note on
                            noteMap[pitch] = ds.set([delta, pitch, velocity, delta]);
                            //series[psynth.SynthAdapter.SETVELOCITY].set([delta, velocity]);
                        } else {
                            // note off
                            var dataPoint = noteMap[pitch];
                            dataPoint[3] = delta - dataPoint[3];
                        }
                        break;
                    case psynth.SynthAdapter.SETCTRL8:
                        ds.set(delta, stream.readUint8());
                        break;
                    default:
                        throw new Error(`Unsupported command #${cmd}`);
                }
            }
        );
    };

    psynth.SynthAdapter.prototype.fromDataSeries = function(series, channelId) {
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
                            sequence = new Ps.Sequence(this);
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
            sequence = sequence || new Ps.Sequence(this);
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

    psynth.SynthAdapter.prototype.createDialog = function(type) {
        var ui = psynth.SynthAdapter.dialogs[type];
        if (!ui) {
            throw new Error(`Invalid dialog type ${type}!`);
        }
        switch (type) {
            case 'device':
                ui.items.id.setValue(`device${('0' + (this.devices.length+1)).slice(-2)}`);
                break;
            case 'sequence':
                break;
        }
        
        return ui;
    };

    psynth.SynthAdapter.prototype.createDeviceUi = function(device) {
        var ui = new Ui.Synth(device.id);
        ui.dataBind(device);
        ui.addClass('synth');
        return ui;
    };

    psynth.SynthAdapter.prototype.createSequenceUi = function(sequence) {
        var series = this.toDataSeries(sequence);
        var template = {
            'width': 1200,
            'height': 600,
            'unit': [32, 24],
            'grid-color': [0.2, 0.4, 0.6],
            'titlebar': '',
            'line-width': 0.1,
            'path': '/synth/ui',
            'data-source': series
        };
        return new Ui.NoteChart(sequence.id, template, null);    // : new Ui.MultiChart(id, template, null);
    };

    /* Dialogs ***************************************************************/
    function NewDevice() {
        Ui.Board.call(this, 'new-device', {
            "titlebar": false,
            "layout": "free",
            "items": {
                "type": { "label": "Device type", "type": "ddlist", "item-key": false, "item-value": "$key" },
                "id": { "label": "Id", "type": "textbox", "value": '', "events": ["change"] },
                "voices": { "label": "Voices", "type": "pot", "min": 1, "max": 16, "step": 1, "value": 1, "digits": 2 }
            }
        });
        this.items.type.setItems( ['Synth'] );
        this.items.voices.setVisible(false);
    }
    extend(Ui.Board, NewDevice);

    NewDevice.prototype.onchange = function(e) {
        if (e.control == this.items.type) {
            this.items.voices.setVisible(true);
        }
    };

    NewDevice.prototype.getData = function() {
        var initData = new Stream(1);
        initData.writeUint8(this.items.voices.getValue());
        var result = {
            type: this.items.type.getValue(),
            data: new Uint8Array(initData.buffer)
        };
        return result;
    };

    function NewSequence() {
        Ui.Board.call(this, 'new-sequence', {
            "titlebar": false,
            "layout": "free",
            "items": {
                "type": { "label": "Type", "type": "ddlist", "item-key": false, "item-value": "$key" },
                "id": { "label": "Id", "type": "textbox", "value": 'sequence', "events": ["change"] },
                "device": { "label": "Device type", "type": "ddlist", "item-key": "$key", "item-value": false }
            }
        });
        this.items.type.setItems( ['Notes', 'Controller'] );
        this.items.device.setItems( psynth.SynthAdapter.Device );
    }
    extend(Ui.Board, NewSequence);

    NewSequence.prototype.getData = function() {
        var result = {
            type: this.items.type.getValue(),
            device: this.items.device.getValue(),
        };
        return result;
    };


    psynth.SynthAdapter.dialogs = {
        'device': new NewDevice(),
        'sequence': new NewSequence()
    };
})();