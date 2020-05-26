(function () {

    var GE = {
		// properties
		canvas: null,
		gl: null,
		ctx: null,
		frontBuffer: null,
		backBuffer: null,
		managedBuffers: [],
        frame: 0,
        lastTime: 0,
        timer: null,
        inputs: {
        	target: null,
			delta: [0, 0],
			mpos: [0, 0],
			mbuttons: 0,
			keys: []
		},
		T: 50,
		MODE_WEBGL: 'webgl',
		MODE_WEBGL2: 'webgl2',

        // callbacks
		inputHooks: [],
		processInputs: function() { },
        update: function (fm) { },
		render: function (fm) { },

		// methods
        init: function(ref, mode) {
			// get canvas and webgl context
			GE.canvas = (typeof ref === 'string') ? document.querySelector(ref) : ref;
			if (GE.canvas != null) {
				if (mode == GE.MODE_WEBGL) {
					GE.gl = GE.canvas.getContext('webgl');
					window.gl = GE.gl;
				} else if (mode == GE.MODE_WEBGL2) {
					GE.gl = GE.canvas.getContext('webgl2');
					window.gl = GE.gl;
				} else {
					GE.ctx = GE.canvas.getContext('2d');
					GE.createBuffers();
				}

			} else {
				throw new Error('Invalid canvas reference!');
			}
			// reset inputs
	        GE.inputs.target = null,
	        GE.inputs.delta[0] = 0;
			GE.inputs.delta[1] = 0;
			GE.inputs.mpos[0] = 0;
			GE.inputs.mpos[1] = 0;
	        GE.inputs.mbuttons = 0;
        	for (var k=0;k<120;k++) {
				GE.inputs.keys[k] = 0;
			}
			// add event listeners
			GE.canvas.addEventListener('mousedown', GE.readInput);
			GE.canvas.addEventListener('mouseup', GE.readInput);
			document.addEventListener('contextmenu', GE.readInput);
			document.addEventListener('mousemove', GE.readInput);
			document.addEventListener('keydown', GE.readInput);
			document.addEventListener('keyup', GE.readInput);
        },
        readInput: function(event) {
			var e = event;
			GE.inputs.target = e.target;
			switch (e.type) {
				case 'mousedown':
					// clear 'up' bit
					GE.inputs.mbuttons &= 253;
					// set 'down' bit
					GE.inputs.mbuttons |= 1;
					break;
				case 'mouseup':
					// clear 'down' bit
					GE.inputs.mbuttons &= 254;
					// set 'up' bit
					GE.inputs.mbuttons |= 2;
					break;
		//		case 'oncontextmenu'
		//			GE.inputs.mlb &= 255;
		//			break;
				case 'mousemove':
					var pos = [e.clientX, e.clientY];
					GE.inputs.delta[0] = pos[0] - GE.inputs.mpos[0];
					GE.inputs.delta[1] = pos[1] - GE.inputs.mpos[1];
					GE.inputs.mpos[0] = pos[0];
					GE.inputs.mpos[1] = pos[1];
					break;
				case 'keydown':
					var key = e.keyCode;
					GE.inputs.keys[key] = 1;
					break;
				case 'keyup':
					var key = e.keyCode;
					GE.inputs.keys[key] = 0;
					break;
			}
			GE.inputHooks.forEach( x => x(e) );
		},
		readArrows: function() {
			return [-GE.inputs.keys[37] + GE.inputs.keys[39],
					-GE.inputs.keys[38] + GE.inputs.keys[40]];
		},
		createBuffers: function() {
			GE.frontBuffer = new GE.Buffer();
			GE.backBuffer = new GE.Buffer(GE.canvas, true);
		},
		resizeCanvas: function(width, height) {
			if (height === undefined) {
				// scale canvas
				height = GE.canvas.parentNode.clientHeight * width;
				width = GE.canvas.parentNode.clientWidth * width;
			}
			GE.canvas.width = width;
			GE.canvas.height = height;
			/// todo: resize managed buffers
			GE.createBuffers();
		},
        // resizeCanvas: function(canvas, width, height) {
        // 	var cnt = canvas.parentNode;
		//     var width = cnt.clientWidth;
		//     var height = cnt.clientHeight;
		//     canvas.width = width/scale;
		//     canvas.height = height/scale;
		// },

        start: function () {
        	GE.lastTime = Date.now();
            GE.mainloop();
        },
        stop: function () {
            clearTimeout(GE.timer);
        },
        mainloop: function() {
	        try {
				var dt = - GE.lastTime;
				GE.lastTime = Date.now();
				dt += GE.lastTime;
				dt /= 1000;
				clearTimeout(GE.timer);
				GE.processInputs();
	            GE.update(GE.frame, dt);
	            GE.render(GE.frame, dt);
	            GE.frame++;
	            GE.timer = setTimeout(GE.mainloop, GE.T);
	        } catch (error) {
	            Dbg.prln(error.message);
				Dbg.prln(error.stack);
	        }
		},

		// utilities
		// Buffer() - create front Buffer
		// Buffer(GE.canvas) - create back Buffer
		// Buffer(canvas) - create unmanaged Buffer from canvas
		// Buffer(canvas, true) - create managed Buffer from canvas
		// Buffer(image) - create unmanaged Buffer from image
		// Buffer(image, true) - create managed Buffer from image
		Buffer: function(source, managed) {
			if (source === undefined) {
				this.canvas = GE.canvas;
				this.ctx = GE.ctx;
				managed = true;
			} else if (source === GE.canvas || source instanceof HTMLCanvasElement ||source instanceof Image) {
				this.canvas = document.createElement('canvas');
				this.canvas.width = source.width;
				this.canvas.height = source.height;
				this.ctx = this.canvas.getContext('2d');
				if (managed) {
					this.canvas.width = GE.canvas.width;
					this.canvas.height = GE.canvas.height;
					this.ctx.drawImage(source, 0, 0, source.width, source.height, 0, 0, GE.canvas.width, GE.canvas.height);
				} else {
					this.ctx.drawImage(source, 0, 0);
				}
			} else {
				throw new Error('Source has to be an image or a canvas!');
			};
			this.imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
			if (managed === true) {
				GE.managedBuffers.push(this);
			}

			
		}
	};
	GE.Buffer.prototype = {
	    get width() { return this.canvas.width; },
	    get height() { return this.canvas.height; }
        };
	GE.Buffer.prototype.blit = function(target) {
		target = target || GE.frontBuffer;
		target.ctx.putImageData(this.imgData, 0, 0);
	};
	GE.Buffer.prototype.update = function() {
		this.imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
	};
	GE.Buffer.prototype.clear = function() {
		this.ctx.clearRect(0, 0, this.width, this.height);
	};
	GE.Buffer.dispose = function(buffer) {
		for (var i=0; i<GE.managedBuffers.length; i++) {
			if (GE.managedBuffers[i] === buffer) {
				GE.managedBuffers.splice(i, 1);
			}
		}
		delete buffer;
	}

	addToSearchPath();

	public(GE, 'GE');
})();
