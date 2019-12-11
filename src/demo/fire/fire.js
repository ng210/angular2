include('/ge/fn.js');

(function() {
	
    function Fire(canvas) {
	    Demo.call(this, 'fire', canvas);
		this.fbmSize = 50;
		this.images = [];
		// create 2 heat maps
		this.heatMaps = [null, null, null];
		// this.colors = [
		// 	[0xff,0x80,0x80], [0x80,0xff,0x80], [0x80,0x80,0xff], [0xff,0xff,0x80],
		// 	[0x80,0xff,0xff], [0x80,0x80,0x80], [0xff,0x80,0xff], [0xff,0xff,0xff]
		// ];
		this.mode = 0;
		this.filter = new Fn.Filter([
			[0.00, 0.10, 0.00],
			[0.07, 0.30, 0.07],
			[0.10, 0.70, 0.10]
		]);

		this.constructor = Fire;
    }
	Fire.prototype = new Demo;

    Fire.prototype.prepare = async function() {
		// create list of images
		var urls = [
			'/demo/lens/lens.gif', '/demo/lens/deepspace.jpg',
			'/demo/fire/fire.gif', '/demo/rotozoom/javascript.gif',
			'/test/test.gif'
		];
		var res = await load(urls);
		for (var i=0; i<res.length; i++) {
			if (!(res[i].error instanceof Error) && res[i].node instanceof Image) {
				var url = res[i].resolvedUrl;
				var ix = url.lastIndexOf('/') + 1;
				res[i].node.alt = url.substring(ix != 0 ? ix : 0);
				this.images.push(res[i].node);
			}
		}
		this.ui.controls.images.setItems(this.images.map(v => v.alt));
	};
	Fire.prototype.setImage = function() {
		var ix = this.ui.controls.images.getSelectedItem().index;
		var img = this.images[ix];
		var buffer = new GE.Buffer(img, true);
		this.heatMaps[0] = this.createHeatMap(buffer);
		this.heatMaps[2] = this.createHeatMap(buffer);
		GE.Buffer.dispose(buffer);
	};
	Fire.prototype.initialize = function() {
		// if (this.heatMaps[0] == null) {
		// 	this.heatMaps[0] = this.createHeatMap();
		// }
		this.heatMaps[1] = this.createHeatMap();
	};
	Fire.prototype.renderUi = function(node) {
		Demo.prototype.renderUi.call(this, node);
		this.setImage();
	};
	Fire.prototype.createHeatMap = function(buffer) {
		buffer = buffer || GE.frontBuffer;
		var heatMap = {
			width: buffer.width,
			height: buffer.height,
			data: new Float32Array(buffer.width * buffer.height)
		};
		var ix = 0;
		for (var j=0; j<buffer.height; j++) {
			for (var i=0; i<buffer.width; i++) {
				var v = 0.2989 * buffer.imgData.data[ix*4] +
						0.5870 * buffer.imgData.data[ix*4+1] +
						0.1140 * buffer.imgData.data[ix*4+2];
					v /= 255;
				heatMap.data[ix++] = v*v;
			}
		}
		return heatMap;
	};
    Fire.prototype.processInputs = function(e) {
		if ((GE.inputs.mbuttons & 2) != 0) {
			Dbg.prln('mouse: ' + GE.inputs.mpos);
			var mode = this.mode & 0x01;
			this.mode &= 0xfe;
			this.mode |= 1 - mode;
			GE.inputs.mbuttons &= 253;
		}
		this.mode &= 0xfd;
		if (GE.inputs.keys[16] != 0) {
			this.mode |= 0x02;
		}
	};
	Fire.prototype.onchange = function(setting) {
		switch (setting.dataField) {
			case 'resolution':
				this.onresize();
				break;
			case 'images':
				this.setImage();
				break;
		}
	};
	Fire.prototype.heatToColor = function(v) {
		var tix = this.ui.controls.color.getSelectedItem().index;
		var tbl = [
			[
				[1.00, 255, 255, 255, 255],
				[0.95, 255, 255, 255, 255],
				[0.80, 255, 240, 128, 255],
				[0.60, 240,  64,  64, 192],
				[0.40, 128,  64,  64, 128],
				[0.10,  64,  64,  64,  64],
				[0.0,   0,   0,   0,   0]
			],
			[
				[1.0, 255, 255, 255, 255],
				[0.9, 255, 255, 255, 255],
				[0.8, 128, 160, 240, 255],
				[0.7,  64,  64, 192, 128],
				[0.5,  64,  64,  64,  64],
				[0.0,   0,   0,   0,   0]
			]
		];
		
		var col = [0, 0, 0, 0];
		var tab = tbl[tix];
		var i0 = tab[0];
		v *= v;
		for (var i=1; i<tab.length; i++) {
			var i1 = tab[i];
			if (v > i1[0]) {
				var r = (v - i1[0])/(i0[0] - i1[0]);
				for (var j=0; j<4; j++) {
					col[j] = Math.floor(r*(i0[j+1] - i1[j+1]) + i1[j+1]);
				}
				break;
			}
			i0 = i1;
		}
		return col;
	};
    Fire.prototype.update = function(frame, dt) {
		var id = frame % 2;
		var source = this.heatMaps[id];
		var target = this.heatMaps[1 - id];
		var ix = 0;
		var cooling = 1 - this.data.cooling;
		for (var j=0; j<source.height; j++) {
			for (var i=0; i<source.width; i++) {
				var v = this.filter.apply(source.data, source.width, source.height, 1, i, j, 0);
				var motion = Fn.lerp(1.0, Math.random(), this.data.motion);
				var heat = this.data.feedback * motion * this.heatMaps[2].data[ix];
				if (this.mode) {
					heat = 1 - heat;
				}
				target.data[ix] = cooling*v + heat*heat;
				var rgba = this.heatToColor(v);
				GE.backBuffer.imgData.data[4*ix] = rgba[0];
				GE.backBuffer.imgData.data[4*ix+1] = rgba[1];
				GE.backBuffer.imgData.data[4*ix+2] = rgba[2];
				GE.backBuffer.imgData.data[4*ix+3] = rgba[3];
				ix++;
			}
		}
	};
    Fire.prototype.render = function(frame) {
		GE.backBuffer.blit();
		GE.ctx.globalAlpha = 0.3;
		GE.ctx.font = '8px Consolas';
		GE.ctx.fillStyle = "#ffe080";
		GE.ctx.textAlign = "left";
		GE.ctx.fillText("mode:" + this.mode, 0, GE.canvas.height - 2);
		GE.ctx.globalAlpha = 1.0;
	};

	public(Fire, 'Fire');
})();
