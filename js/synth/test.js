include('/ge/player/player-lib.js');
include('/synth/synth.js');
include('/synth/synth-adapter.js');
include('/synth/synth-adapter-ext.js');
include('/synth/ui/synth-ui.js');
include('/utils/syntax.js');
include('/synth/grammar.js');

(function(){

    var synthAdapter = new psynth.SynthAdapter();

    function createSequence() {
        var seq = new Ps.Sequence(synthAdapter);
        seq.writeHeader();
        // #00: frame(0, on(17, 127))
        seq.writeDelta(0); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(127); seq.writeEOF();
        // #02: frame(2, off(17))
        seq.writeDelta(2); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(0); seq.writeEOF();
        // #04: frame(2, on(29, 127))
        seq.writeDelta(2); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(29); seq.writeUint8(127); seq.writeEOF();
        // #06: frame(2, off(29))
        seq.writeDelta(2); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(29); seq.writeUint8(0); seq.writeEOF();
        // #08: frame(2, on(17, 127))
        seq.writeDelta(2); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(127); seq.writeEOF();
        // #09: frame(1, off(17))
        seq.writeDelta(1); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(0); seq.writeEOF();
        // #10: frame(1, on(17, 127))
        seq.writeDelta(1); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(127); seq.writeEOF();
        // #11: frame(1, off(17))
        seq.writeDelta(1); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(17); seq.writeUint8(0); seq.writeEOF();
        // #12: frame(1, on(29, 127))
        seq.writeDelta(1); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(29); seq.writeUint8(127); seq.writeEOF();
        // #14: frame(2, off(29))
        seq.writeDelta(2); seq.writeCommand(psynth.SynthAdapter.SETNOTE); seq.writeUint8(29); seq.writeUint8(0); seq.writeEOF();
        // #16: frame(2, end)
        seq.writeDelta(2); seq.writeEOS();
        return seq;
    }

    function compare(a1, a2) {
        var a = a1, b = a2;
        if (a1.length < a2.length) { a = a2; b = a1; }
        for (var i=0; i<a.length; i++) {
            if (a[i] != b[i]) return i+1;
        }
        return 0;
    }

    function test_synthAdapterToDataSeries() {
        message('Test SynthAdapter.toDataSeries');
        var series = synthAdapter.toDataSeries(createSequence());
        var channelCount = Object.keys(series).length;
        var notes = series[psynth.SynthAdapter.SETNOTE];
        var velocity = series[psynth.SynthAdapter.SETVELOCITY];
        test('Should have 2 channels', context => context.assert(channelCount, '=', 2));
        test('Should have a notes channel', context => context.assert(notes, '!=', undefined));
        test('Should have 5 note commands', context => context.assert(notes.data.length, '=', 5));
        // test('Should have a velocity channel', context => context.assert(velocity, '!=', undefined));
        // test('Should have 5 velocity commands', context => context.assert(velocity.data.length, '=', 5));
        test('Should have correct note commands', context => {
            var expected = {
                0: [ 0, 17, 127, 2],
                4: [ 4, 29, 127, 2],
                10: [10, 17, 127, 1]
            };
            context.assert(notes.getRange([0,], [10,]), ':=', expected);
        });
    }

    function test_synthAdapterFromDataSeries() {
        var sequence = createSequence();
        var expected = new Uint8Array(sequence.stream.buffer);
        var series = synthAdapter.toDataSeries(sequence);
        var received =  new Uint8Array(synthAdapter.fromDataSeries(series).stream.buffer);
        return [
            'SynthAdapter.fromDataSeries',
            test('Convert all channels', () => {
                var result = compare(expected, received);
                if (result != 0) {
                    var start = result-2 >= 0 ? result-2 : 0;
                    var a1 = expected.slice(start, start+4);
                    var a2 = received.slice(start, start+4);
                    return [`Mismatch at ${result-1}!\n expected: ${a1}\n received: ${a2}`];
                }
            })
        ];
    }

    function test_synth_controls(synth, expected) {
        var errors = [];
        for (var i in psynth.Ctrl) {
            var ctrl = synth.getControl(psynth.Ctrl[i]);
            var value = ctrl.value;
            //if (value == expected || expected < ctrl.min && value == ctrl.min || expected > ctrl.max && value == ctrl.max)
            if (value != expected && (expected >= ctrl.min || value != ctrl.min) && (expected <= ctrl.max || value != ctrl.max))
            {
                errors.push(`Value of ${i}=${value} should be ${expected} or minimum or maximum`);
            }
        }
        return errors.length ? errors : false;
    }

    function test_ui_controls(pots, expected) {
        var errors = [];
        for (var i=0; i<pots.length; i++) {
            if (pots[i].value != expected) {
                errors.push(`Value of ${pots[i].id}=${value} should be ${expected}`);
            }
        }
        return errors.length ? errors : false;
    }

    var _synth = null;
    var _ui = null;
    function setupSynth() {
        _synth = new psynth.Synth(48000, 6);
        _ui = new Ui.Synth('Synth1');
        _ui.addClass('synth');
        _ui.dataBind(_synth);
        _ui.render({element: document.body});

        return _ui;
    }

    function test_synth_Ui_binding() {
        var results = ['Synth Ui binding'];

        if (!_synth) setupSynth();
        var ui = _ui;
        var synth = _synth;

        var inputs = [ui.modules];
        var pots = [];

        while (inputs.length > 0) {
            var control = inputs.pop();
            if (control instanceof Ui.ValueControl) {
                pots.push(control);
            } else {
                var collection = control instanceof Ui.Board ? control.items : control;
                for (var i in collection) {
                    inputs.push(collection[i]);
                }
            }
        }
        for (var i=0; i<pots.length; i++) {
            pots[i].setValue(500.0);
            // if (pots[i] instanceof Ui.Pot) {
            //     pots[i].setValue(500.0);
            // } else if (pots[i] instanceof Ui.Select) {
            //     console.log(pots[i].id);
            // }
        }

        results.push(
            test('All ui controls set to 500', () => {
                return test_synth_controls(synth, 500.0)
            })
        );

        for (var i=0; i<pots.length; i++) {
            pots[i].setValue(0.0);
        }
        results.push(
            test('All ui controls set to 0.0', () => {
                return test_synth_controls(synth, 0.0)
            })
        );

        for (var i in psynth.Ctrl) {
            synth.getControl(psynth.Ctrl[i]).set(1.0);
        }
        results.push(
            test('All synth controls set to 1.0', () => {
                return test_ui_controls(synth, 1.0)
            })
        );

        for (var i in psynth.Ctrl) {
            synth.getControl(psynth.Ctrl[i]).set(0.0);
        }
        results.push(
            test('All synth controls set to 0.0', () => {
                return test_ui_controls(synth, 0.0)
            })
        );

        return results;
    }

    async function test_synth_fromPreset() {
        var results = ['Test presets'];
        if (!_synth) setupSynth();
        var ui = _ui;
        var synth = _synth;

        await Ui.Synth.loadPresets();
        ui.render({force:true});
        results.push(
            test('Creates a new preset', () => {
                ui.createPreset('blank');        
            }),
            test('Setting a preset changes the controls', () => {
                ui.toolbar.items.preset.select('default');
            }),
        );

        return results;
    }

var tests = () => [ test_synthAdapterToDataSeries/*, test_synthAdapterFromDataSeries, test_synth_Ui_binding, test_synth_fromPreset*/ ];

    public(tests, 'Synth tests');
})();