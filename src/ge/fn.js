(function() {
	var Fn = {
		'smoothstep': x => x*(3*x-2*x*x),
		'quantize': (x, s) => 2*Math.round(0.5*(x+1)*s)/s-1,
		'lerp': (x1, x2, f) => (1-f)*x1 + f*x2,
		'clamp': (x, min, max) => (x > min) ? ((x < max) ? x : max) : min,
	};

	Fn.Filter = function(coeffs) {
		this.coeffs = coeffs;

		this.constructor = Fn.Filter;
	};
	Fn.Filter.prototype.apply = function(data, width, height, stride, x, y, z) {
		var n1 = Math.floor(this.coeffs[0].length/2);
		var n2 = Math.ceil(this.coeffs[0].length/2);
		var m1 = Math.floor(this.coeffs.length/2);
		var m2 = Math.ceil(this.coeffs.length/2);
		var v = 0, x1 = x-n1, x2 = x+n2, y1 = y-m1, y2 = y+m2;
		if (x == 0) {
			x1 = x;
		} else if (x == width-1) {
			x2 = x;
		}
		if (y == 0) { 
			y1 = y;
		} else if (y == height-1) {
			y2 = y;
		}
		var swidth = width*stride;
		var dx = x2 - x1, dy = y2 - y1;
		var ix = (y1 * width + x1)*stride;
		var w = 0;
		for (var j=0; j<dy; j++) {
			var ixb = ix;
			for (var i=0; i<dx; i++) {
				w += this.coeffs[j][i];
				v += this.coeffs[j][i] * data[ix + z]
				ix += stride;
			}
			ix = ixb + swidth;
		}
		return w != 0 ? v/w : 0;
	};

	public(Fn, 'Fn');
})();