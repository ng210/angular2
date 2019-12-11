include('demo.js');
include('/ge/fn.js');

(function() {

    function Plasma(canvas) {
		Demo.call(this, 'plasma', canvas);
		this.vx = 0;
		this.vy = 0;
		this.counter = 0;

		this.constructor = Plasma;
    }
	Plasma.prototype = new Demo;

    Plasma.prototype.prepare = async function() {
	};
	Plasma.prototype.initialize = function() {
		this.onresize();
	};
    Plasma.prototype.processInputs = function(e) {
	};
	Plasma.prototype.onchange = function(setting) {
		switch (setting.dataField) {
			case 'shape':
				this.onresize();
				break;
		}
	};
    Plasma.prototype.update = function(frame, dt) {
		this.counter += this.data.motion * dt;
		var ix = 0;
		for (var j=0; j<GE.frontBuffer.height; j++) {
			for (var i=0; i<GE.frontBuffer.width; i++) {
				var x = i/GE.frontBuffer.width - 0.5;
				var y = j/GE.frontBuffer.height - 0.5;
				var v = 0;
				var cx = x * this.data.zoom;
				var cy = y * this.data.zoom;
				v += this.vx * Math.cos(cx + this.counter);
				v += this.vy * Math.sin(cy + this.counter);
				v += Math.sin((cx + cy + this.counter)/2.0);
				cx += Math.sin(this.counter/3.0);
				cy += Math.cos(this.counter/2.0);
				v += Math.sin(Math.sqrt(cx*cx + cy*cy) + this.counter);
				v *= this.data.variation;
				var r = 0.5 + 0.5*Math.sin(Math.PI * v + this.counter);
				var g = 0.5 + 0.5*Math.sin(Math.PI * (v - 0.5) + this.counter);
				var b = 0.5 + 0.5*Math.cos(Math.PI * v + this.counter);
				var c = 0.2989 * r + 0.5870 * g + 0.1140 * b;

				GE.frontBuffer.imgData.data[ix++] = 255 * Fn.lerp(c, r, this.data.color);
				GE.frontBuffer.imgData.data[ix++] = 255 * Fn.lerp(c, g, this.data.color);
				GE.frontBuffer.imgData.data[ix++] = 255 * Fn.lerp(c, b, this.data.color);
				GE.frontBuffer.imgData.data[ix++] = 255;
			}
		}
	};
    Plasma.prototype.render = function(frame) {
		GE.frontBuffer.blit();
	};
	Plasma.prototype.updateVelocity = function() {
		this.vx = this.data.shape;
		this.vy = this.data.shape * GE.frontBuffer.height/GE.frontBuffer.width;
	};
    Plasma.prototype.onresize = function(e) {
		this.updateVelocity();
	};
	// Plasma.prototype.getMouseCoors = function(v) {
	// 	v.x = GE.inputs.mpos[0] * GE.canvas.width/GE.canvas.clientWidth;
	// 	v.y = GE.inputs.mpos[1] * GE.canvas.height/GE.canvas.clientHeight;
	// };

	public(Plasma, 'Plasma');
})();
