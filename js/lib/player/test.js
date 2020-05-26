include('player-lib.js');

(function(){

    const TestAdapter = {

    };
    TestAdapter.__proto__ = Ps.IAdapter;
    TestAdapter.info = {name: '_TestAdapter', id: 0};
    TestAdapter.getInfo = function() { return TestAdapter.info; };
    //TestAdapter.registerCommands = function(registry) { throw new Error('Not implemented!'); };
    TestAdapter.prepareContext = function(data) { Dbg.prln('Prepare context'); };
    TestAdapter.createDevice = function(data) {
        var el = document.createElement('div');
        el.id = 'testTarget';
        el.style.position = 'absolute';
        el.style.left = '100px'; el.style.top = '100px';
        el.style.width = '20em'; el.style.height = '2em';
        el.style.border = 'solid 2px yellow';
        el.style.color = 'cyan';
        el.style.zIndex = 1000;
        el.style.backgroundColor = 'silver';
        document.body.appendChild(el);
        return el;
    };
    TestAdapter.processCommand = function(device, command, sequence, cursor) {
        var colors = [
            '#0000ff', '#4080ff', '#80ffff', '#c080ff', '#ff00ff'
        ];
        switch (command) {
            case TestAdapter.SETTEXT:
                var text = '', c = null;
                while ((c = String.fromCharCode(sequence.getUint8(cursor++))) != '\0') text += c;
                device.innerHTML = text;
                break;
            case TestAdapter.SETINK:
                var c = sequence.getUint8(cursor++);
                device.style.color = colors[c % colors.length];
                break;
        }
        return cursor;
    };
    TestAdapter.updateRefreshRate = function(device, command) { throw new Error('Not implemented!'); };
    TestAdapter.getCommandSize = function(command, args) {
    };
    TestAdapter.makeCommand = function(command)  {
        var stream = new Stream(128);
        stream.writeUint8(command);
        switch (command) {
            case TestAdapter.SETTEXT:
                if (arguments[1] instanceof Ps.Sequence) {
                    stream.writeString(arguments[1].stream.readString(arguments[2]));
                } else {
                    stream.writeString(arguments[1]);
                }
                break;
            case TestAdapter.SETINK:
                if (arguments[1] instanceof Ps.Sequence) {
                    stream.writeUint8(arguments[1].stream.readUint8(arguments[2]));
                } else {
                    stream.writeUint8(arguments[1]);
                }
                break;
        }
        return new Stream(stream);
    };
    TestAdapter.SETTEXT = 2;
    TestAdapter.SETINK = 3;

    function createPlayer() {
        //var testAdapter = new TestAdapter();
        var player = new Ps.Player();
        player.addAdapter(TestAdapter);
        player.devices.push(TestAdapter.createDevice(null));
        return player;
    }

    function createTestSequences() {
        var sequences = [];
        var sequence = new Ps.Sequence(TestAdapter);
        sequence.writeHeader();
        // Frame #1
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq1.1');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(0);
        sequence.writeEOF();
        // Frame #2
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq1.2');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(1);
        sequence.writeEOF();
        // Frame #3
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq1.3');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(2);
        sequence.writeEOF();
        // Frame #4
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq1.4');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(3);
        sequence.writeEOF();
        // Frame #5
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('End');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(4);
        sequence.writeEOF();
        // Frame #6
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(0);
        sequence.writeEOS();
        sequences.push(sequence);

        sequence = new Ps.Sequence(TestAdapter);
        // Frame #1
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq2.1');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(4);
        sequence.writeEOF();
        // Frame #2
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq2.2 - End');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(2);
        sequence.writeEOS();
        sequences.push(sequence);

        sequence = new Ps.Sequence(TestAdapter);
        // Frame #1
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq3.1');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(1);
        sequence.writeEOF();
        // Frame #2
        sequence.writeDelta(16);
        sequence.writeCommand(TestAdapter.SETTEXT); sequence.writeString('Seq3.2 - End');
        sequence.writeCommand(TestAdapter.SETINK); sequence.writeUint8(3);
        sequence.writeEOS();
        sequences.push(sequence);
        return sequences;
    }

    async function startPlayBack(channel) {
        function loop(resolve) {
            clearTimeout(timer);
            if (channel.run(1)) {
                timer = setTimeout(loop, 20, resolve);
            } else {
                var text = channel.player.devices[0].innerHTML == 'End' ? false : ['Playback not correct'];
                resolve(text);
            }
        }
        var timer = null;
        return new Promise(resolve => {
            loop(resolve);
        });
    }

    function setup() {
        var player = createPlayer();
        var sequence = createTestSequences()[0];
        var channel = new Ps.Channel('test01', player);
        channel.assign(player.devices[0], sequence);
        return channel;
    }

    async function test_channel_run() {
        var channel = setup();
        channel.loopCount = 1;
        channel.isActive = true;
        return [
            'Test Channel.run',
            test('Playback should run correctly', () => {
                return startPlayBack(channel);
            })
        ];
    }

    function test_sequence_toFrames() {
        var sequence = createTestSequences()[0];
        var frames = sequence.toFrames();
        // check frames
        // if (frames.length != 6) errors.push('Frame count is not 5!');
        // var fi = 0;
        // for (; fi<5; fi++) {
        //     var frame = frames[fi];
        //     if (frame.delta != 16) errors.push(`Frame #${fi+1} delta is not 16!`);
        //     if (frame.commands.length != 2) errors.push(`Frame #${fi+1} does not have exactly 2 commands!`);
        //     if (frame.commands[0].readUint8(0) != TestAdapter.SETTEXT) errors.push(`Frame #${fi+1} command is not SETTEXT!`);
        // }
        // var frame = frames[fi];
        // if (frame.delta != 16) errors.push(`Frame #${fi+1} delta is not 16!`);
        // if (frame.commands.length != 1) errors.push(`Frame #${fi+1} does not have exactly 1 commands!`);
        // if (frame.commands[0].readUint8(0) != TestAdapter.SETINK) errors.push(`Frame #${fi+1} command is not SETINK!`);
        // return errors.length > 0 ? errors.join('\n') : 'Tests successful!';

        return [
            'Test Sequence.toFrames',
            test('Frame count should be 5', () => {
                if (frames.length != 6) return ['Frame count is not 5!'];
            }),
            test('Sequence should be ok', () => {
                var fi = 0;
                var errors = [];
                for (; fi<5; fi++) {
                    var frame = frames[fi];
                    if (frame.delta != 16) errors.push(`Frame #${fi+1} delta is not 16!`);
                    if (frame.commands.length != 2) errors.push(`Frame #${fi+1} does not have exactly 2 commands!`);
                    if (frame.commands[0].readUint8(0) != TestAdapter.SETTEXT) errors.push(`Frame #${fi+1} command is not SETTEXT!`);
                }
                return errors;
            }),
            test('Frame #6 should be ok', () => {
                var errors = [];
                var frame = frames[5];
                if (frame.delta != 16) errors.push(`Frame #${fi+1} delta is not 16!`);
                if (frame.commands.length != 1) errors.push(`Frame #${fi+1} does not have exactly 1 commands!`);
                if (frame.commands[0].readUint8(0) != TestAdapter.SETINK) errors.push(`Frame #${fi+1} command is not SETINK!`);
                return errors;
            }),
        ];

    }

    function test_channel_toFrames() {
        var channel = setup();
        channel.toFrames();

        return [
            'Test Channel.toFrames',
            test('Frame count should be 5', () => {
                if (channel.frames.length != 6) return ['Frame count is not 5!'];
            }),
            test('Sequence should be ok', () => {
                var errors = [];
                for (var fi=0; fi<5; fi++) {
                    var frame = channel.frames[fi];
                    if (frame.delta != 16) errors.push(`Frame #${fi+1} delta is not 16!`);
                    if (frame.commands.length != 2) errors.push(`Frame #${fi+1} does not have exactly 2 commands!`);
                    if (frame.commands[0].readUint8(0) != TestAdapter.SETTEXT) errors.push(`Frame #${fi+1} command is not SETTEXT!`);
                }
                return errors;
            }),
            test('Frame #6 should be ok', () => {
                var errors = [];
                var frame = channel.frames[5];
                if (frame.delta != 16) errors.push(`Frame #6 delta is not 16!`);
                if (frame.commands.length != 1) errors.push(`Frame #6 does not have exactly 1 commands!`);
                if (frame.commands[0].readUint8(0) != TestAdapter.SETINK) errors.push(`Frame #6 command is not SETINK!`);
                return errors;
            }),
        ];
    }

    function test_channel_toSequence() {
        var channel = setup();
        channel.toFrames();
        var sequence = channel.sequence;
        channel.toSequence();
        return [
            'Test Channel.toSequence',
            test('Converted stream should match input stream', () => {
                var pos = 0;
                for (var i=0; i<channel.sequence.cursor; i++) {
                    if (sequence.cursor <= i || sequence.getUint8(i) != channel.sequence.getUint8(i)) {
                        return [`Stream does not match at ${pos}`];
                    }
                }
            })
        ];
    }

    async function test_channel_insertFrame() {
        var channel = setup();
        channel.toFrames();
        var adapter = channel.adapter;
        var frame = new Ps.Frame();
        frame.delta = 8;
        frame.commands.push(adapter.makeCommand(TestAdapter.SETTEXT, 'New'));
        frame.commands.push(adapter.makeCommand(TestAdapter.SETINK, 4));
        channel.frames.splice(1, 0, frame);
        channel.toSequence();
        //channel.reset();
        channel.loopCount = 1;
        channel.isActive = true;

        return [
            'Test insert frame',
            test('Playback should be correct', () => {
                return startPlayBack(channel);
            })
        ];
    }

    function test_stream() {
        var stream = new Stream(4);
        Dbg.prln(stream.cursor);
        stream.writeUint8(72);
        Dbg.prln(stream.cursor);
        stream.writeString('ello');
        Dbg.prln(stream.cursor);
        stream.writeUint8(32);
        Dbg.prln(stream.cursor);
        stream.writeString('World!');
        Dbg.prln(stream.cursor);

        var str = [];
        var chars = new Uint8Array(stream.buffer.slice(0, stream.cursor));
        chars.forEach(x => str.push(String.fromCharCode(x)));
        Dbg.prln(str.join(''));
        //if (str.join('') != 'Hello World!') throw new Error('Stream test failed!');

//         var arr = ['H','e','l','l','o',' ','W','o','r','l','d','!'];
//         stream = new Stream(arr);
//         str = [];
//         chars = new Uint8Array(stream.buffer.slice(0, stream.cursor));
//         chars.forEach(x => str.push(String.fromCharCode(x)));
//         Dbg.prln(str.join(''));
    }

    var tests = async function() {
        return [
            await test_channel_run(),
            test_channel_toFrames(),
            test_sequence_toFrames(),
            test_channel_toSequence(),
            await test_channel_insertFrame()
        ];
    };

    public(tests, 'Player tests');
})();
