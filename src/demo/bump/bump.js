include('demo.js');
include('/ge/math/v2.js');

(function() {
	
    function Bump(canvas) {
		Demo.call(this, 'bump', canvas);
		this.images = [];
		this.lightPos = new V2(.5, .5);
		this.heightMap = null;
		this.constructor = Bump;
    }
	Bump.prototype = new Demo;

  Bump.prototype.prepare = async function() {
		// create list of images
		var urls = [
			'/demo/bump/bump.gif', '/demo/bump/bump2.gif',
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
	Bump.prototype.createHeightMap = function() {
		var ix = this.ui.controls.images.getSelectedItem().index;
		var img = this.images[ix];
		var buffer = new GE.Buffer(img, true);
		this.heightMap = {
			buffer: buffer,
			map: new Uint8Array(buffer.width * buffer.height)
		}
		var ix = 0;
		for (var j=0; j<this.heightMap.buffer.height; j++) {
			for (var i=0; i<this.heightMap.buffer.width; i++) {
				this.heightMap.map[ix] = 0.2989 * buffer.imgData.data[ix*4];
				this.heightMap.map[ix] += 0.5870 * buffer.imgData.data[ix*4+1];
				this.heightMap.map[ix] += 0.1140 * buffer.imgData.data[ix*4+2];
				ix++;
			}
		}
	};
	Bump.prototype.initialize = function() {
	};
	Bump.prototype.renderUi = function(node) {
		Demo.prototype.renderUi.call(this, node);
		this.createHeightMap();
	};
  Bump.prototype.processInputs = function(e) {
		this.getMouseCoors(this.lightPos);
	};
	Bump.prototype.onchange = function(setting) {
		switch (setting.dataField) {
			case 'resolution':
				this.onresize();
				break;
			case 'images':
				this.createHeightMap();
				break;
		}
	};
  Bump.prototype.update = function(frame, dt) {
		var wi = this.heightMap.buffer.width;
		var he = this.heightMap.buffer.height;
		var radius = 0.5 * (this.settings.radius + 0.01) * wi;
		var ix = wi + 1;
		//GE.ctx.clearRect(0, 0, wi, he);
		for (var y=1; y<he-1; y++) {
			for (var x=1; x<wi-1; x++) {
				var lx = x - this.lightPos.x;
				var ly = y - this.lightPos.y;
				var h = this.heightMap.map[ix] * this.settings.ambient;
				var l = Math.sqrt(lx*lx + ly*ly);
				if (l < radius)
				{
					var nx = this.heightMap.map[ix-1] - this.heightMap.map[ix+1];
					var ny = this.heightMap.map[ix-wi] - this.heightMap.map[ix+wi];

					lx -= nx;
					if (lx < 0) lx = -lx;
					if (lx > 127) lx = 127;
					nx = 127-lx;
					if (nx < 0) nx = 1;

					ly -= ny;
					if (ly < 0) ly = -ly;
					if (ly > 127) ly = 127;
					ny = 127-ly;
					if (ny < 0) ny = 1;

					h += (nx + ny) * this.settings.intensity * Math.cos(Math.PI/2 * l/radius);
				}
				if (h > 255) h = 255;
				if (h < 0) h = 0;
				h /= 255;
				GE.backBuffer.imgData.data[4*ix+0] = h*this.heightMap.buffer.imgData.data[4*ix];
				GE.backBuffer.imgData.data[4*ix+1] = h*this.heightMap.buffer.imgData.data[4*ix+1];
				GE.backBuffer.imgData.data[4*ix+2] = h*this.heightMap.buffer.imgData.data[4*ix+2];
				GE.backBuffer.imgData.data[4*ix+3] = 255;
				ix++;
			}
			// skip last pixel and first pixel on next row
			ix+=2;
		}
	};
  Bump.prototype.render = function(frame) {
		GE.backBuffer.blit();
	};
  Bump.prototype.onresize = function(e) {
		// handler of window resize
//		GE.resizeCanvas(GE.canvas, 1);	//this.data.resolution);
//		var he = GE.canvas.height;
//		this.aspect = GE.canvas.width/he;
//		GE.ctx.setTransform(he/2, 0, 0, he/2, GE.canvas.width/2, he/2);
	};
	Bump.prototype.getMouseCoors = function(v) {
		v.x = GE.inputs.mpos[0]*GE.canvas.width/GE.canvas.clientWidth;	//2*GE.inputs.mpos[0]/this.data.resolution/GE.canvas.height - this.aspect;
		v.y = GE.inputs.mpos[1]*GE.canvas.height/GE.canvas.clientHeight;	//2*GE.inputs.mpos[1]/this.data.resolution/GE.canvas.height - 1.0;
	};

	public(Bump, 'Bump');
})();

