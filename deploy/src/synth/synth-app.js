var ns_synth = require('/ge/synth.js');
var ns_player = require('/ge/player.js');

(function(){
	var sound = require('/ge/sound.js');
	var SynthAdapter = require('/ge/synthAdapter.js');
	var Pot = require('/synth/Pot.js');

	var synthApp = {
		frame: 0,
		frameCounter: 0,
		player: null,
		synths: [],

		init: function() {
			SynthApp.createSynth('synth1');
			// createSynthUI('synth1', g_synth);
			// createSynthUI('synth2', g_synth);
			SynthApp.createPlayer();
			SynthApp.player.addTarget(SynthApp.synths[0], new SynthAdapter());
			sound.init(48000, SynthApp.fillSoundBuffer);
		},
		createPlayer: function() {
			SynthApp.player = new ns_player.Player();
			// todo: read sequence from UI
			var mainSeq = [
				new ns_player.Command(  0, ns_player.Cmd_setTempo, [8, 8]),		// set fps to 9, tpf to 4 (makes 5 tps)
				new ns_player.Command(  0, ns_player.Cmd_assign, [0, 1, 1]),	// connect target #0 with sequence #1 with status active
				new ns_player.Command( 33, ns_player.Cmd_assign, [0, 2, 1]),	// connect target #0 with sequence #1 with status active
				new ns_player.Command( 33, ns_player.Cmd_assign, [0, 1, 1]),	// connect target #0 with sequence #1 with status active
				new ns_player.Command( 33, ns_player.Cmd_assign, [0, 3, 1]),	// connect target #0 with sequence #1 with status active
				new ns_player.Command( 33, ns_player.Cmd_end, null)					// end
			];
			var subSeq11 = [
				new ns_player.Command(   0, SynthAdapter.Cmd_setNote, [12, 0.7]),	// 0
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.7]),	// 2
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [24, 0.7]),	// 4
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.7]),	// 6
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
				new ns_player.Command(   4, ns_player.Cmd_end, null)				// 0
			];
			var subSeq12 = [
				new ns_player.Command(   0, SynthAdapter.Cmd_setNote, [12, 0.7]),	// 0
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.7]),	// 2
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [15, 0.7]),	// 4
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [15, 0.0]),
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [17, 0.7]),	// 6
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [17, 0.0]),
				new ns_player.Command(   4, ns_player.Cmd_end, null)				// 0
			];
			var subSeq13 = [
				new ns_player.Command(   0, SynthAdapter.Cmd_setNote, [12, 0.7]),	// 0
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.7]),	// 2
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [12, 0.0]),
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [20, 0.7]),	// 4
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [20, 0.0]),
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [19, 0.7]),	// 6
				new ns_player.Command(   4, SynthAdapter.Cmd_setNote, [19, 0.0]),
				new ns_player.Command(   4, ns_player.Cmd_end, null)				// 0
			];
			// the the master has to be the very first sequence
			SynthApp.player.addSequence(mainSeq);
			SynthApp.player.addSequence(subSeq11);
			SynthApp.player.addSequence(subSeq12);
			SynthApp.player.addSequence(subSeq13);
		},
		createSynth: function(lbl) {
			var synth = new ns_synth.Synth(48000, 1);
			synth.setup([
				ns_synth.Ctrl.amp, 0.6,
				ns_synth.Ctrl.lfo1fre, 5.1,     ns_synth.Ctrl.lfo1amp, 0.2,	ns_synth.Ctrl.lfo1wave, ns_synth.WF_SIN,
				ns_synth.Ctrl.lfo2fre, 5.0,     ns_synth.Ctrl.lfo2amp, 2.0,	ns_synth.Ctrl.lfo2wave, ns_synth.WF_SIN,
		
				ns_synth.Ctrl.env1atk, 0.001,   ns_synth.Ctrl.env1dec, 0.12,
				ns_synth.Ctrl.env1sus, 0.2,     ns_synth.Ctrl.env1rel, 0.2,
				ns_synth.Ctrl.env1dc,  0.0,     ns_synth.Ctrl.env1amp, 0.8,
		
				ns_synth.Ctrl.env2atk, 0.0,		ns_synth.Ctrl.env2dec, 0.05,
				ns_synth.Ctrl.env2sus, 0.5,		ns_synth.Ctrl.env2rel, 0.5,
				ns_synth.Ctrl.env2dc,  1.0,		ns_synth.Ctrl.env2amp, 1.0,
		
				ns_synth.Ctrl.osc1wave, ns_synth.WF_TRI,
				ns_synth.Ctrl.osc1fre, 1.0,		ns_synth.Ctrl.osc1amp, 0.6,	ns_synth.Ctrl.osc1psw, 0.93,
				ns_synth.Ctrl.osc1tune, 12.0,
				ns_synth.Ctrl.osc2wave, ns_synth.WF_PLS,
				ns_synth.Ctrl.osc2fre, 0.8,		ns_synth.Ctrl.osc2amp, 0.1,	ns_synth.Ctrl.osc2psw, 0.5,
				ns_synth.Ctrl.osc2tune, 12
			]);
			this.synths.push(synth);
			var synthElem = document.getElementById(lbl);
			// fetch templates
			var tmpl = load('./synth.tmpl.html');
			var envTmpl = tmpl.getElementsByClassName('env')[0];
			var oscTmpl = tmpl.getElementsByClassName('osc')[0];
			var lfoTmpl = tmpl.getElementsByClassName('lfo')[0];
			// env1
			var env = envTmpl.cloneNode();
			env.id = lbl + 'Env1';
			env.innerHTML = envTmpl.innerHTML.replace(/{{id}}/g, 'env1');
			synthElem.appendChild(env);
			// env2
			env = envTmpl.cloneNode();
			env.id = lbl + 'Env2';
			env.innerHTML = envTmpl.innerHTML.replace(/{{id}}/g, 'env1');
			synthElem.appendChild(env);
			// osc1
			var osc = oscTmpl.cloneNode();
			osc.id = lbl + 'Osc1';
			osc.innerHTML = oscTmpl.innerHTML.replace(/{{id}}/g, 'osc1');
			synthElem.appendChild(osc);
			// osc2
			osc = oscTmpl.cloneNode();
			osc.id = lbl + 'Osc2';
			osc.innerHTML = oscTmpl.innerHTML.replace(/{{id}}/g, 'osc2');
			synthElem.appendChild(osc);
			// lfo1
			var lfo = lfoTmpl.cloneNode();
			lfo.id = lbl + 'Lfo1';
			lfo.innerHTML = lfoTmpl.innerHTML.replace(/{{id}}/g, 'lfo1');
			synthElem.appendChild(lfo);
			// lfo2
			lfo = lfoTmpl.cloneNode();
			lfo.id = lbl + 'Lfo2';
			lfo.innerHTML = lfoTmpl.innerHTML.replace(/{{id}}/g, 'lfo2');
			synthElem.appendChild(lfo);
			// set potmeters
			var pots = synthElem.getElementsByClassName('pot');
			for (var i=0; i<pots.length; i++) {
				Pot.bind(pots[i], synth);
			}
		},
		fillSoundBuffer: function(buffer, bufferSize) {
			//var samplesPerFrame = 48000 / SynthApp.player.refreshRate;
			var start = 0;
			var end = 0;
			var remains = bufferSize;
			while (remains) {
				if (SynthApp.frameCounter == 0) {
					SynthApp.frame++;
					SynthApp.player.run(1);
					//console.log('player #' + SynthApp.frame + ', ' + _sum);
					_sum = 0;
					SynthApp.frameCounter = 48000 / SynthApp.player.refreshRate;
				}
				var len = SynthApp.frameCounter < remains ? SynthApp.frameCounter : remains;
				_sum += len;
				end = start + len;
				SynthApp.frameCounter -= len;
				SynthApp.synths[0].run(buffer, start, end);
				start = end;
				remains -= len;
			}
		}		
	};
	Object.defineProperty(global, 'SynthApp', { "value": synthApp });
	//module.exports = synthApp;
})();

var _sum = 0;