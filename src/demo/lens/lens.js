include('demo.js');
include('/ge/math/v2.js');

(function() {

    function Lens(canvas) {
		Demo.call(this, 'lens', canvas);
		this.cursorPos = new V2();
		this.heightMap = null;
		this.buffer = null;

		this.constructor = Lens;
	}
	Lens.prototype = new Demo;

	Lens.prototype.prepare = async function() {
		//var res = await load('/demo/lens/lens.gif');
		var res = await load('/demo/lens/deepspace.jpg');
		//var res = await load('/demo/fire/fire.gif');
		//var res = await load('/demo/rotozoom/javascript.gif');
		//var res = await load('/test/test.gif');
		if (res.error instanceof Error) {
			throw res.error;
		} else {
			this.img = res.node;
		}
	};
	Lens.prototype.initialize = function() {
		GE.resizeCanvas(this.img.width > 800 ? 800 : this.img.width, this.img.height > 600 ? 600 : this.img.height);
		this.buffer = new GE.Buffer(this.img, true);
		this.getMouseCoors(this.cursorPos);
		this.onresize();
	};
	Lens.prototype.processInputs = function(e) {
		this.getMouseCoors(this.cursorPos);
	};
	Lens.prototype.onchange = function(setting) {
		switch (setting.dataField) {
			case 'radius':
				this.radius = 0.2 * setting.getValue() * this.buffer.width;
				this.rsize = this.radius * this.data.size;
				break;
			case 'size':
				this.rsize = this.radius * setting.getValue();
				break;
			case 'interpolation':
				this.ui.controls.size.disable(setting.getValue() == 'none');
				break;
		}
	};
	Lens.prototype.update = function(frame, dt) {
		var src = this.buffer.imgData;
		var dst = GE.frontBuffer.imgData;
		var stride = dst.width * 4;
		var interpolation = this.ui.controls.interpolation.getSelectedItem().index;
		//var radius = 0.2 * this.data.radius * this.buffer.width;
		var zoom = /*1.0 -*/ this.data.zoom;
		var ix = 0, ix2;
		for (var y=0; y<dst.height-1; y++) {
			var cy = y - this.cursorPos.y;
			for (var x=0; x<dst.width-1; x++) {
				var dx = x - this.cursorPos.x;
				var dy = cy;
				var d = Math.sqrt(dx*dx + dy*dy);
				// pixels outside the radius are copied without change
				if (d > this.radius) {
					dst.data[ix+0] = src.data[ix+0];
					dst.data[ix+1] = src.data[ix+1];
					dst.data[ix+2] = src.data[ix+2];
					dst.data[ix+3] = 255;
				} else {
					var a = Math.atan(dy/dx);
					if (dx < 0) a += Math.PI;
					var v = 0;
					switch (interpolation) {
						case 0: //y = z
							v = 1;
							break;
						case 1: //y = (1-z)*x+z
							var v = d < this.rsize ? 1 : 1 - (d-this.rsize)/(this.radius-this.rsize);
							break;
						case 2: //y = (1-z)*sin(PI/2*x)+z
							v = d < this.rsize ? 1 : 0.5 * (Math.cos(Math.PI*(d-this.rsize)/(this.radius-this.rsize)) + 1.0);
							break;
					}
					var r = d*(1 - zoom*v);
					var rx2 = this.cursorPos.x + Math.cos(a)*r;
					var ry2 = this.cursorPos.y + Math.sin(a)*r;
					var nx = Math.floor(rx2);
					var ny = Math.floor(ry2);
					rx2 -= nx; ry2 -= ny;
					var rx1 = 1.0-rx2, ry1 = 1.0-ry2;
					ix2 = nx*4 + ny*stride;
					// bilinear filtering
					for (var ci=0; ci<3; ci++) {
						var c11 = src.data[ix2+ci], c12 = src.data[ix2+4+ci];
						var c21 = src.data[ix2+stride+ci], c22 = src.data[ix2+stride+4+ci];
						dst.data[ix+ci] = ry1*(c11*rx1 + c12*rx2) + ry2*(c21*rx1 + c22*rx2);
					}
					dst.data[ix+3] = 255;
				}
				ix += 4;
			}
			ix += 4;
		}
	};
	Lens.prototype.render = function(frame) {
		GE.frontBuffer.blit();
	};
	Lens.prototype.onresize = function(e) {
		this.radius = 0.2 * this.data.radius * this.buffer.width;
		this.rsize = this.radius * this.data.size;
	};
	Lens.prototype.getMouseCoors = function(v) {
		v.x = GE.inputs.mpos[0] * GE.canvas.width/GE.canvas.clientWidth;
		v.y = GE.inputs.mpos[1] * GE.canvas.height/GE.canvas.clientHeight;
	};
	public(Lens, 'Lens');
})();