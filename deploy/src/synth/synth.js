/******************************************************************************
 * PSynth library
 *****************************************************************************/
(function() {

	var psynth = {

		WF_NONE: 0,
		WF_SIN:  1,
		WF_TRI:  2,
		WF_SAW:  4,
		WF_PLS:  8,
		WF_RND: 16,

		FM_LP: 1,
		FM_BP: 2,
		FM_HP: 4,

		Ctrl: {
			// GENERAL
			amp: 	   0,

			// LFO
			lfo1amp:  10,
			lfo1dc: 11,
			lfo1fre:  12,
			lfo1wave: 13,

			lfo2amp:  20,
			lfo2dc: 21,
			lfo2fre:  22,
			lfo2wave: 23,

			// env
			env1amp:  30,
			env1dc:   31,
			env1atk:  32,
			env1dec:  33,
			env1sus:  34,
			env1rel:  35,

			env2amp:  40,
			env2dc:   41,
			env2atk:  42,
			env2dec:  43,
			env2sus:  44,
			env2rel:  45,

			env3amp:  70,
			env3dc:   71,
			env3atk:  72,
			env3dec:  73,
			env3sus:  74,
			env3rel:  75,

			// osc
			osc1amp:  50,
			osc1dc:   51,
			osc1fre:  52,
			osc1note: 53,
			osc1tune: 54,
			osc1psw:  55,
			osc1wave: 56,

			osc2amp:  60,
			osc2dc:   61,
			osc2fre:  62,
			osc2note: 63,
			osc2tune: 64,
			osc2psw:  65,
			osc2wave: 66,

			// flt
			fltamp: 80,
			fltcut: 81,
			fltres: 82,
			fltmod: 84,
			fltmode: 83
		},

		theta: 2 * Math.PI,

		p2f: function(p) {
			// c = pow(2, 1/12); f = pow(c, pitch)*ref_freq (=C0)
			var f = ((p == 0) ? 0.0 : (Math.pow(1.05946309436, p) * 20.60172230705));
			return f;
		},
		/******************************************************************************
		 * Prototype of a Potmeter (input element)
		 *****************************************************************************/
		Pot: function(min, max, value) {
			this.min = min;
			this.max = max;
			this.value = value;
		},

		/******************************************************************************
		 * Prototype of an envelope generator
		 *****************************************************************************/
		Env: function(parent, controls) {
			this.parent = parent;
			this.gate = 0;
			this.velocity = 0;
			this.phase = 7;	// idle
			this.timer = 0;
			this.ticks = 0;
			this.rate = 0;

			this.amp = controls.amp;
			this.dc  = controls.dc;
			this.atk = controls.atk;
			this.dec = controls.dec;
			this.sus = controls.sus;
			this.rel = controls.rel;
		},

		/******************************************************************************
		 * Prototype of an oscillator
		 *****************************************************************************/
		Osc: function(parent, controls) {
			this.parent = parent;
			this.timer = 0;
			this.smp = 0;
			
			this.amp = controls.amp;
			this.dc  = controls.dc;
			this.fre  = controls.fre;
			this.note = controls.note;
			this.tune = controls.tune;
			this.psw  = controls.psw;
			this.wave = controls.wave;
		},

		Filter: function(parent, controls) {
			this.parent = parent;
			this.ai = [.0, .0, .0];
			this.bi = [.0, .0, .0];
			this.ci = [.0, .0, .0];
			this.ui = [.0, .0, .0];
			this.vi = [.0, .0, .0];

			this.lp = [.0, .0];
			this.hp = [.0, .0];

			this.gain = controls.gain;
			this.cut = controls.cut;
			this.res = controls.res;
			this.mod = controls.mod;
			this.mode = controls.mode;
		},

		/******************************************************************************
		 * Prototype of a voice for polyphony
		 *****************************************************************************/
		Voice: function(parent) {
			this.velocity = new psynth.Pot(0, 1, 0);
			this.note = new psynth.Pot(0, 96, 0);
			// create a basic synth with 2 oscillators and 2 envelopes for AM
			this.envelopes = [ new psynth.Env(parent, parent.controls.env1), new psynth.Env(parent, parent.controls.env2), new psynth.Env(parent, parent.controls.env3) ];
			this.lfos = [ new psynth.Osc(parent, parent.controls.lfo1), new psynth.Osc(parent, parent.controls.lfo2) ];
			parent.controls.osc1.note = this.note; parent.controls.osc2.note = this.note;
			this.oscillators = [ new psynth.Osc(parent, parent.controls.osc1), new psynth.Osc(parent, parent.controls.osc2) ];
			this.filter = new psynth.Filter(parent, parent.controls.flt);
		},

		/******************************************************************************
		 * Prototype of a simple software synth
		 *****************************************************************************/
		Synth: function(smpRate, voiceCount) {
			this.smpRate = smpRate;
			this.omega = psynth.theta / smpRate;
			this.nextVoice = 0;
			this.label = '';
			// create controls
			this.controls = {
				amp: new psynth.Pot(0, 1, .8),
				env1: {
					amp: new psynth.Pot(0, 1, .5),
					dc:  new psynth.Pot(0, 1, .5),
					atk: new psynth.Pot(0, 1, .5),
					dec: new psynth.Pot(0, 1, .5),
					sus: new psynth.Pot(0, 1, .5),
					rel: new psynth.Pot(0, 1, .5),
				},
				env2: {
					amp: new psynth.Pot(0, 1, .5),
					dc:  new psynth.Pot(0, 1, .5),
					atk: new psynth.Pot(0, 1, .5),
					dec: new psynth.Pot(0, 1, .5),
					sus: new psynth.Pot(0, 1, .5),
					rel: new psynth.Pot(0, 1, .5)
				},
				env3: {
					amp: new psynth.Pot(0, 1, .5),
					dc:  new psynth.Pot(0, 1, .5),
					atk: new psynth.Pot(0, 1, .5),
					dec: new psynth.Pot(0, 1, .5),
					sus: new psynth.Pot(0, 1, .5),
					rel: new psynth.Pot(0, 1, .5)
				},
				lfo1: {
					amp: new psynth.Pot(0, 1, .5),
					dc:  new psynth.Pot(0, 1, .0),
					fre: new psynth.Pot(0, 1, .5),
					note: new psynth.Pot(0, 1, .0),
					tune: new psynth.Pot(0, 1, .0),
					psw: new psynth.Pot(0, 1, .5),
					wave: new psynth.Pot(0, 127, 1),
				},
				lfo2: {
					amp: new psynth.Pot(0, 1, .5),
					dc:  new psynth.Pot(0, 1, .0),
					fre: new psynth.Pot(0, 1, .5),
					note: new psynth.Pot(0, 1, .0),
					tune: new psynth.Pot(0, 1, .0),
					psw: new psynth.Pot(0, 1, .5),
					wave: new psynth.Pot(0, 127, 1),
				},
				osc1: {
					amp: new psynth.Pot(0, 1, .5),
					dc:  new psynth.Pot(0, 1, .0),
					fre: new psynth.Pot(0, 1, .5),
					note: null,
					tune: new psynth.Pot(0, 1, .0),
					psw: new psynth.Pot(0, 1, .5),
					wave: new psynth.Pot(0, 127, 1),
				},
				osc2: {
					amp: new psynth.Pot(0, 1, .5),
					dc:  new psynth.Pot(0, 1, .0),
					fre: new psynth.Pot(0, 1, .5),
					note: null,
					tune: new psynth.Pot(0, 1, .0),
					psw: new psynth.Pot(0, 1, .5),
					wave: new psynth.Pot(0, 127, 2),
				},
				flt: {
					amp: new psynth.Pot(0, 1, .5),
					cut:  new psynth.Pot(0, 1, .4),
					res: new psynth.Pot(0, 1, .2),
					mod: new psynth.Pot(0, 1, .1),
					mode: new psynth.Pot(0, 7, 1),
				}
			};
			// create voices
			this.voices = [];
			for (var i=0; i<voiceCount; i++) {
				this.voices.push(new psynth.Voice(this));
			}
		}
	};

	/*****************************************************************************/
	psynth.Pot.prototype.set = function(value) {
		if (value > this.min) {
			if (value < this.max) {
				this.value = value;
			} else {
				this.value = this.max;
			}
		} else {
			this.value = this.min;
		}
		return this.value;
	};
	/*****************************************************************************/
	psynth.Env.prototype.setGate = function(velocity) {
		if (this.gate <= 0) {
			if (velocity > 0) {
				// slope up: retrigger envelope
				this.phase = 1;
				this.timer = 0;
				this.ticks = 0;
				this.gate = 1;
				this.velocity = velocity;
			}			
		} else {
			if (velocity <= 0) {
				// slope down: start release phase
				this.phase = 5;
				this.timer = this.sus.value;
				this.gate = 0;
			}
		}
	};
	psynth.Env.prototype.run = function(am) {
		switch (this.phase) {
			case 1: // atk precalc
				// 0.0 : 0.005s -> 1/(0*3.995 + 0.005)/smpRate = 200/smpRate
				// 1.0 : 4.0s -> 1/(1*3.995 + 0.005)/smpRate
				//   X : Xs -> 1/(3.995*X + 0.005)/smpRate
				this.rate = 1/(this.parent.smpRate * (3.995 * this.atk.value + 0.005));
				this.phase++;
			case 2: // atk
				this.timer += this.rate;
				if (this.timer >= 1.0) {
					this.phase++;
					this.timer = 1.0;
				}
				//smp = smooth(this.timer);
				break;
			case 3:	// dec precalc
				// 0.0 : 0.005s -> 1/(0*3.995 + 0.005)/smpRate = 200/smpRate
				// 1.0 : 4.0s -> 1/(1*3.995 + 0.005)/smpRate
				//   X : Xs -> 1/(3.995*X + 0.005)/smpRate
				this.rate = 1/(this.parent.smpRate * (3.995 * this.dec.value + 0.005));
				this.phase++;
			case 4: // dec/sustain
				if (this.timer <= this.sus.value) {
					this.timer = this.sus.value;
				} else {
					this.timer -= this.rate;
					//var susm1 = 1- this.sus;
					//smp = susm1*smooth((this.timer-this.sus)/susm1) + this.sus;
				}
				break;
			case 5:	// rel precalc
				// 0.0 :  0.005s -> 1/(0*9.995 + 0.005)/smpRate = 200/smpRate
				// 1.0 : 10.0s -> 1/(1*9.995 + 0.005)/smpRate
				//   X :  Xs -> 1/(9.995*X + 0.005)/smpRate
				this.rate = 1/(this.parent.smpRate * (9.995 * this.rel.value + 0.005));
				this.phase++;
			case 6: // rel
				this.timer -= this.rate;
				if (this.timer <= 0.0) {
					this.phase = 7;	// set to idle
					this.timer = 0.0;
				}
				//smp = this.sus*smooth(this.timer/this.sus);
				break;
		}
		this.ticks++;
		return this.amp.value*am*this.timer*this.velocity + this.dc.value;
	};
	/*****************************************************************************/
	psynth.Osc.prototype.run = function(am, fm, pm) {
		var pitch = this.note.value + this.tune.value;
		var delta = (this.fre.value + fm + psynth.p2f(pitch))/this.parent.smpRate;
		if (delta >= 1.0) {
			delta = 0.99999999;
		}
		var psw = pm + this.psw.value;
		var out = 0.0;
		var wf = this.wave.value;
		var wfc = 0;
		if ((wf & psynth.WF_SIN) != 0) {
			var arg = psynth.theta * this.timer;
			out += Math.sin(arg);
			wfc++;
		}
		if ((wf & psynth.WF_TRI) != 0) {
			var tmp = ((this.timer < psw) ? this.timer/psw : (1.0 - this.timer)/(1.0 - psw));
			out += 2*tmp - 1.0;
			wfc++;
		}
		if ((wf & psynth.WF_SAW) != 0) {
			out += ((this.timer < psw) ? 2.0 * this.timer/psw : 0.0);
			out -= 1.0;
			wfc++;
		}
		if ((wf & psynth.WF_PLS) != 0) {
			out += this.timer < psw ? 1.0 : -1.0;
			wfc++;
		}
		if ((wf & psynth.WF_RND) != 0) {
			if (this.timer < delta ||
				this.timer > 0.5 && this.timer < 0.5 + delta)
				this.smp = Math.random();
			out += this.smp;
			wfc++;
		}
		if (wfc > 1) {
			out /=  wfc;
		}
		if ((this.timer += delta) > 1.0) {
			this.timer -= 1.0;
		}
		return this.amp.value*am*out + this.dc.value;
	};
	/*****************************************************************************/
	psynth.Filter.prototype.run = function(input) {
		// Apply filter
		var gain = 1.0/this.ai[0];
		var lp = (this.bi[0]*input + this.bi[1]*this.ui[0] + this.bi[2]*this.ui[1] - this.ai[1]*this.lp[0] - this.ai[2]*this.lp[1])*gain;
		var hp = (this.ci[0]*input + this.ci[1]*this.vi[0] + this.ci[2]*this.vi[1] - this.ai[1]*this.hp[0] - this.ai[2]*this.hp[1])*gain;
		// lp inputs
		this.ui[1] = this.ui[0]; this.ui[0] = input;
		// hp inputs
		this.vi[1] = this.vi[0]; this.vi[0] = input;
		// lp outputs
		this.lp[1] = this.lp[0]; this.lp[0] = lp;
		// hp outputs
		this.hp[1] = this.hp[0]; this.hp[0] = hp;

		var output = 0.0;
		if ((this.mode.value & psynth.FM_LP) != 0) // lowpass
			output += lp;
		if ((this.mode.value & psynth.FM_HP) != 0) // hipass
			output += hp;
		return gain * output;
	};
	psynth.Filter.prototype.onchange = function(cut) {
		// Update filter coefficients
		var res = (this.res.value < 0.000001) ? 1.0: 1.0 - this.res.value;
		var e = this.cut.value + this.mod.value * cut;
		var g = -res * e;
		var b0 = e*e;
		this.bi[0] = this.bi[1] = b0; this.bi[2] = 2*b0;
		this.ci[0] = this.ci[2] = 1; this.ci[1] = -2;
		this.ai[0] = b0 + 1.0 - g;
		this.ai[2] = b0 + 1.0 + g;
		this.ai[1] = 2*(b0 - 1);

	};
	/*****************************************************************************/
	psynth.Voice.prototype.setNote = function(note, velocity) {
		this.note.value = note;
		for (var i=0; i<this.lfos.length; i++) {
			this.lfos[i].timer = 0;
		}
		for (var i=0; i<this.envelopes.length; i++) {
			this.envelopes[i].setGate(velocity);
		}
	};
	psynth.Voice.prototype.run = function() {
		// run LFOs
		var lfo1 = this.lfos[0].run(1.0, 0.0, 0.0);
		var lfo2 = this.lfos[1].run(1.0, 0.0, 0.0);
		// // run main oscillators
		var amp = this.envelopes[0].run(lfo1);
		var psw = this.envelopes[1].run(1.0);
		var cut = this.envelopes[2].run(1.0);
		var smp1 = this.oscillators[0].run(amp, lfo2, psw);
		var smp2 = this.oscillators[1].run(amp, lfo2, psw);
		this.filter.onchange(cut * 1.0);
		var out = this.filter.run(smp1 + smp2);
		return out;
	};
	psynth.Voice.prototype.isActive = function() {
		return this.envelopes[0].phase < 7;
	}
	psynth.Voice.prototype.getTicks = function() {
		return this.envelopes[0].ticks;
	}
	/*****************************************************************************/
	psynth.Synth.prototype.setup = function(values) {
		for (var i=0; i<values.length; i+=2) {
			var ctrlId = values[i];
			var key = Object.keys(psynth.Ctrl).find(
				function(k) {
					return psynth.Ctrl[k] == ctrlId;
				}
			);
			if (key === undefined) {
				console.log('No control with the id ' + ctrlId + ' was found!');
			}
			this.getControl(values[i]).value = values[i+1];
		}
	};
	psynth.Synth.prototype.getControl = function(controlId) {
		var pot = null;
		switch (controlId) {
			case psynth.Ctrl.amp: pot = this.controls.amp; break;
			// LFO
			case psynth.Ctrl.lfo1amp: pot = this.controls.lfo1.amp; break;
			case psynth.Ctrl.lfo1dc: pot = this.controls.lfo1.dc; break;
			case psynth.Ctrl.lfo1fre: pot = this.controls.lfo1.fre; break;
			case psynth.Ctrl.lfo1wave: pot = this.controls.lfo1.wave; break;

			case psynth.Ctrl.lfo2fre: pot = this.controls.lfo2.fre; break;
			case psynth.Ctrl.lfo2dc: pot = this.controls.lfo2.dc; break;
			case psynth.Ctrl.lfo2amp: pot = this.controls.lfo2.amp; break;
			case psynth.Ctrl.lfo2wave: pot = this.controls.lfo2.wave; break;

			// env
			case psynth.Ctrl.env1amp: pot = this.controls.env1.amp; break;
			case psynth.Ctrl.env1dc:  pot = this.controls.env1.dc; break;
			case psynth.Ctrl.env1atk: pot = this.controls.env1.atk; break;
			case psynth.Ctrl.env1dec: pot = this.controls.env1.dec; break;
			case psynth.Ctrl.env1sus: pot = this.controls.env1.sus; break;
			case psynth.Ctrl.env1rel: pot = this.controls.env1.rel; break;

			case psynth.Ctrl.env2amp: pot = this.controls.env2.amp; break;
			case psynth.Ctrl.env2dc:  pot = this.controls.env2.dc; break;
			case psynth.Ctrl.env2atk: pot = this.controls.env2.atk; break;
			case psynth.Ctrl.env2dec: pot = this.controls.env2.dec; break;
			case psynth.Ctrl.env2sus: pot = this.controls.env2.sus; break;
			case psynth.Ctrl.env2rel: pot = this.controls.env2.rel; break;

			case psynth.Ctrl.env3amp: pot = this.controls.env3.amp; break;
			case psynth.Ctrl.env3dc:  pot = this.controls.env3.dc; break;
			case psynth.Ctrl.env3atk: pot = this.controls.env3.atk; break;
			case psynth.Ctrl.env3dec: pot = this.controls.env3.dec; break;
			case psynth.Ctrl.env3sus: pot = this.controls.env3.sus; break;
			case psynth.Ctrl.env3rel: pot = this.controls.env3.rel; break;

			// osc
			case psynth.Ctrl.osc1amp: pot = this.controls.osc1.amp; break;
			case psynth.Ctrl.osc1dc:  pot = this.controls.osc1.dc; break;
			case psynth.Ctrl.osc1fre: pot = this.controls.osc1.fre; break;
			case psynth.Ctrl.osc1note: pot = this.controls.osc1.note; break;
			case psynth.Ctrl.osc1tune: pot = this.controls.osc1.tune; break;
			case psynth.Ctrl.osc1psw: pot = this.controls.osc1.psw; break;
			case psynth.Ctrl.osc1wave: pot = this.controls.osc1.wave; break;

			case psynth.Ctrl.osc2amp: pot = this.controls.osc2.amp; break;
			case psynth.Ctrl.osc2dc:  pot = this.controls.osc2.dc; break;
			case psynth.Ctrl.osc2fre: pot = this.controls.osc2.fre; break;
			case psynth.Ctrl.osc2note: pot = this.controls.osc2.note; break;
			case psynth.Ctrl.osc2tune: pot = this.controls.osc2.tune; break;
			case psynth.Ctrl.osc2psw: pot = this.controls.osc2.psw; break;
			case psynth.Ctrl.osc2wave: pot = this.controls.osc2.wave; break;

			// filter
			case psynth.Ctrl.fltamp: pot = this.controls.flt.amp; break;
			case psynth.Ctrl.fltcut:  pot = this.controls.flt.cut; break;
			case psynth.Ctrl.fltres: pot = this.controls.flt.res; break;
			case psynth.Ctrl.fltmod: pot = this.controls.flt.mod; break;
			case psynth.Ctrl.fltmode: pot = this.controls.flt.mode; break;

			default: console.log('The control id ' + controlId + ' is invalid!'); break
		}
		return pot;
	};
	psynth.Synth.prototype.setNote = function(note, velocity) {
		var voice = null;
		if (velocity != 0) {
			// get free voice
			var voice = this.voices[0];
			var ix = 0;
			for (var i=0; i<this.voices.length; i++) {
				if (voice.getTicks() < this.voices[i].getTicks()) {
					voice = this.voices[i];
					ix = i;
				}
				if (!this.voices[i].isActive()) {
					voice = this.voices[i];
					ix = i;
					break;
				}
			}
			voice.setNote(note, velocity);
			//this.voices[this.nextVoice].setNote(note, velocity);
			console.log(`${this.label}.on #${ix}: ${note} - ${voice.getTicks()}`);
			return;
		} else {
			for (var i=0; i<this.voices.length; i++) {
				voice = this.voices[i];
				if (voice.envelopes[0].phase < 5 && voice.note.value == note) {
					voice.setNote(note, 0);
					console.log(`${this.label}.off #${i}: ${note}`);
					return;
				}
			}
		}
		console.log(`${this.label}.off ???: ${note}`);
		//throw new Error('voice not found!');
	};
	psynth.Synth.prototype.run = function(buffer, start, end) {
		for (var i=start; i<end; i++) {
			var smp = 0;
			for (var j=0; j<this.voices.length; j++) {
				smp += this.voices[j].run();
			}
			buffer[i] += smp;
		}
		//console.log(buffer[start]);
	};

	public(psynth, 'psynth');
})();