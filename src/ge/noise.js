(function() {
	include('/ge/fn.js');

	function Noise(seed) {
		this.seed = seed || (new Date()).getTime();
		this.cache = [];
		
		this.fillCache();
		
		this.constructor = Noise;
	}
	Noise.SIZE = 256;  // must be power of 2
	Noise.MASK = Noise.SIZE-1;
	Noise.prototype.fillCache = function() {
		var tmp = [];
		for (var i=0; i<2*Noise.SIZE; i++) {
			tmp.push(i & Noise.MASK);
		}
		var n = this.seed;
		while (tmp.length > 0) {
			this.cache.push(tmp.splice(n & Noise.MASK, 1)[0]);
			n = Math.random()*tmp.length;
			//n = n*152751 + 314767;
		}
	};

	Noise.prototype.get1d = function(x) {
		var xi = Math.floor(x);
		var xf = x - xi;
		xi = xi & Noise.MASK;
		var v1 = this.cache[xi];
		var v2 = this.cache[xi+1];
		return Fn.lerp(v1, v2, xf)/Noise.SIZE;
	};
	Noise.prototype.get2d = function(x, y) {
		var xi = Math.floor(x), yi = Math.floor(y);
		var xf = x - xi, yf = y - yi;
		
		xi = xi & Noise.MASK;
		yi = yi & Noise.MASK;
		var i1 = this.cache[xi] + yi;
		var i2 = this.cache[xi + 1] + yi;
		var i3 = i1 + 1;
		var i4 = i2 + 1;
		var v1 = Fn.lerp(this.cache[i1], this.cache[i2], xf);
		var v2 = Fn.lerp(this.cache[i3], this.cache[i4], xf);
		return Fn.lerp(v1, v2, yf)/Noise.SIZE;
	};
	Noise.prototype.get3d = function(x, y, z) {
		var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
		var xf = x - xi, yf = y - yi, zf = z - zi;
		
		// 	  7-----8		1: (0, 0, 0)	2: (1, 0, 0)
		//	 /|	   /|		3: (0, 1, 0)	4: (1, 1, 0)
		//  3-----4 |		5: (0, 0, 1)	6: (1, 0, 1)
		//  | 5---|-6		7: (0, 1, 1)	8: (1, 1, 1)
		//	|/	  |/		
		//  1-----2			
		
		xi = xi & Noise.MASK;
		yi = yi & Noise.MASK;
		zi = zi & Noise.MASK;
		var i1 = this.cache[this.cache[xi] + yi] + zi;
		var i2 = this.cache[this.cache[xi+1] + yi] + zi;
		var i3 = this.cache[this.cache[xi] + yi+1] + zi;
		var i4 = this.cache[this.cache[xi+1] + yi+1] + zi;
		var i5 = i1 + 1;
		var i6 = i2 + 1;
		var i7 = i3 + 1;
		var i8 = i4 + 1;
		var v1 = Fn.lerp(this.cache[i1], this.cache[i2], xf);
		var v2 = Fn.lerp(this.cache[i3], this.cache[i4], xf);
		var v3 = Fn.lerp(this.cache[i5], this.cache[i6], xf);
		var v4 = Fn.lerp(this.cache[i7], this.cache[i8], xf);
		var v5 = Fn.lerp(v1, v2, yf);
		var v6 = Fn.lerp(v3, v4, yf);
		return Fn.lerp(v5, v6, zf)/Noise.SIZE;
	};
	Noise.prototype.fbm1d = function(x, n, a0, f0, an, fn) {
		var fi = f0, ai = a0;
		var v = ai * this.get1d(x);
		for (var i=1; i<n; i++) {
			ai *= an; fi *= fn;
			v += ai * this.get1d(fi*x);
		}
		return v;
	};
	Noise.prototype.fbm2d = function(x, y, n, a0, f0, an, fn) {
		var fi = f0, ai = a0;
		var v = ai * this.get2d(x, y);
		for (var i=1; i<n; i++) {
			ai *= an; fi *= fn;
			v += ai * this.get2d(fi*x, fi*y);
		}
		return v;
	};
	Noise.prototype.fbm3d = function(x, y, z, n, a0, f0, an, fn) {
		var fi = f0, ai = a0;
		var v = ai * this.get3d(x, y, z);
		for (var i=1; i<n; i++) {
			ai *= an; fi *= fn;
			v += ai * this.get3d(fi*x, fi*y, fi*z);
		}
		return v;
	};

	public(Noise, 'Noise');
})();