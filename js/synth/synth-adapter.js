include('/ge/player/player-lib.js');
include('/synth/synth.js');
include('/ge/sound.js');

(function() {
	function SynthAdapter() {
		this.devices = [];
	}
	extend(Ps.IAdapter, SynthAdapter);
	//SynthAdapter.prototype = Ps.IAdapter;

	SynthAdapter.prototype.getInfo = function() { return psynth.SynthAdapter.info; },
	//registerCommands: function(registry) { throw new Error('Not implemented!'); },
	SynthAdapter.prototype.prepareContext = function(settings) {
		sound.init(settings.samplingRate, this.fillSoundBuffer);
		// create audio process worker
	};
	SynthAdapter.prototype.createDevice = function(deviceType, initData) {
		var cursor = 0;
		var device = null;
		switch (deviceType) {
			case psynth.SynthAdapter.Device.SYNTH:
				var voiceCount = initData[cursor++];
				if (voiceCount != 0) {
					// todo: add sound bank
					device = new psynth.Synth(sound.smpRate, voiceCount);
				}
				break;
			case psynth.SynthAdapter.Device.DELAY:
				// todo: add presets
				device = new psynth.Delay(sound.smpRate);
				break;
			default:
				throw new Error(`Invalid device type: ${deviceType}`);
		}
		device.type = deviceType;
		this.devices.push(device);
		return device;
	};
	SynthAdapter.prototype.processCommand = function(device, command, sequence, cursor) {
		switch (command) {
			case psynth.SynthAdapter.SETNOTE:
				device.setNote(sequence.getUint8(cursor++), sequence.getUint8(cursor++)/256);
				break;
			case psynth.SynthAdapter.SETCTRL8:
				device.setControl(sequence.getUint8(cursor++), sequence.getUint8(cursor++));
				break;
			case psynth.SynthAdapter.SETCTRL16:
				device.setControl(sequence.getUint8(cursor++), sequence.getUint16(cursor));
				cursor += 2;
				break;
			case psynth.SynthAdapter.SETCTRLF:
				device.setControl(sequence.getUint8(cursor++), sequence.getFloat32(cursor));
				cursor += 4;
				break;
		}
		return cursor;
	};
	//updateRefreshRate: function(target, command) { },

	SynthAdapter.SETNOTE = 2;
	SynthAdapter.SETCTRL8 = 3;
	SynthAdapter.SETCTRL16 = 4;
	SynthAdapter.SETCTRLF = 5;
	SynthAdapter.SETVELOCITY = 6;

	SynthAdapter.Device = {
		SYNTH: 0,
		DELAY: 1
	};

	SynthAdapter.info = {
	    name: 'SynthAdapter',
	    id: 1
	};

	var _sampleCount = 0;
	SynthAdapter.prototype.fillSoundBuffer = function(left, right, bufferSize, channel) {
		//var samplesPerFrame = _settings.samplingRate / SynthApp.player.refreshRate;
		var start = 0;
		var end = 0;
		var remains = bufferSize;
		for (var i=0; i<bufferSize; i++) {
			left[i] = .0;
			right[i] = .0;
		}
		while (remains) {
			if (_frame == 0) {
				update();
				_frame = _samplePerFrame;
				//SynthApp.frameCounter = _settings.samplingRate / SynthApp.player.refreshRate;
			}
			var len = _frame < remains ? _frame : remains;
			end = start + len;
			_frame -= len;
			for (var i=0; i<_player.channels.length; i++) {
				_player.channels[i].target.run(left, right, start, end);
			}
			start = end;
			remains -= len;
			_sampleCount += len;
		}
		//console.log(_sampleCount);
	};


	public(SynthAdapter, 'SynthAdapter', psynth);

})();
