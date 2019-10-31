include('/ge/player/player.js');
include('/synth/synth.js');

(function() {

	psynth.SynthAdapter = {

		SETNOTE: 2,
		SETCTRL8: 3,
		SETCTRL16: 4,
		SETCTRLF: 5,

		DEVICE_SYNTH: 0,
		DEVICE_DELAY: 1,

		devices: [],

		info: {name: 'SynthAdapter', id: 1},
        getInfo: function() { return psynth.SynthAdapter.info; },
        //registerCommands: function(registry) { throw new Error('Not implemented!'); },
        prepareContext: function(data) {
			// todo: initialize sound lib
		},
        createTargets: function(targets, data) {
			var cursor = 0;
			var deviceCount = data[cursor++];
			for (var i=0; i<deviceCount; i++) {
				var device = null;
				switch (data[cursor++]) {
					case psynth.SynthAdapter.DEVICE_SYNTH:
						var voiceCount = data[cursor++];
						// todo: sound banks
						device = new psynth.Synth(48000, voiceCount);
						break;
				}
				psynth.SynthAdapter.devices.push(device);	
				targets.push(device);
			}
		},
        processCommand: function(target, command, sequence, cursor) {
			switch (command) {
				 case psynth.SynthAdapter.SETNOTE:
					target.setNote(sequence.getUint8(cursor++), sequence.getUint8(cursor++)/256);
					break;
				case psynth.SynthAdapter.SETCTRL8:
					target.setControl(sequence.getUint8(cursor++), sequence.getUint8(cursor++));
					break;
				case psynth.SynthAdapter.SETCTRL16:
					target.setControl(sequence.getUint8(cursor++), sequence.getUint16(cursor));
					cursor += 2;
					break;
				case psynth.SynthAdapter.SETCTRLF:
						target.setControl(sequence.getUint8(cursor++), sequence.getFloat32(cursor));
						cursor += 4;
						break;
			}
			return cursor;
		},
        //updateRefreshRate: function(target, command) { },

        // EDITOR
        //getCommandSize: function(command, args) { },
        makeCommand: function(command) {
			var stream = new Stream(128);
			stream.writeUint8(command);
			switch (command) {
				case psynth.SynthAdapter.SETNOTE:
					if (arguments[1] instanceof Player.Sequence) {
						stream.writeStream(arguments[1].stream, arguments[2], 2);
					} else {
						stream.writeUint8(arguments[1]);
						stream.writeUint8(arguments[2]);
					}
				   break;
			   case psynth.SynthAdapter.SETCTRL8:
					if (arguments[1] instanceof Player.Sequence) {
						stream.writeStream(arguments[1].stream, arguments[2], 2);
					} else {
						stream.writeUint8(arguments[1]);
						stream.writeUint8(arguments[2]);
					}
				   break;
			   case psynth.SynthAdapter.SETCTRL16:
					if (arguments[1] instanceof Player.Sequence) {
						stream.writeStream(arguments[1].stream, arguments[2], 3);
					} else {
						stream.writeUint8(arguments[1]);
						stream.writeUint16(arguments[2]);
					}
				   break;
			   case psynth.SynthAdapter.SETCTRLF:
					if (arguments[1] instanceof Player.Sequence) {
						stream.writeStream(arguments[1].stream, arguments[2], 5);
					} else {
						stream.writeUint8(arguments[1]);
						stream.writeFloat32(arguments[2]);
					}
					break;
		   }
		   return cursor;
		}
	};
	psynth.SynthAdapter.__proto__ = Player.IAdapter;
})();