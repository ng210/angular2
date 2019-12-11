include('ge/fn.js');
(function() {

	function Star() {
		this.reset();
		this.constructor = Star;
	}
	Star.prototype.reset = function() {
		// position
		this.pos = [2*Math.random()-1, 2*Math.random()-1];
		// energy and mass
		this.setRadius(0.003);
		this.density = 0.5 + 0.5 * Math.random();
		this.energy = 0;
		this.mass = 0;
		this.updateByRadius();
		// initial velocity
		var arg = 2 * Math.PI * Math.random();
		var r = 0;	//0.0001*Math.random();
		var vx = r*Math.cos(arg), vy = r*Math.sin(arg);
		this.v = [vx, vy];
		// acceleration
		this.a = [0.0, 0.0];
		this.isAlive = true;
//Dbg.prln(this.toString());
	};
	Star.prototype.getColorFromEnergy = function() {
		var map = [
			[0.00, [0x00, 0x00, 0x00, .0]],
			[0.05, [0xa0, 0x60, 0x20, .5]],
			[0.10, [0xff, 0xa0, 0x40, 1.]],
			[0.50, [0xe0, 0xd0, 0x80, 1.]],
			[0.80, [0xc0, 0xe0, 0xff, 1.]],
			[1.00, [0xc0, 0xf0, 0xff, 1.]]
		];
		var fx = this.energy/Star.MAX_ENERGY;
		var f1, f2;
		for (var i=0; i<map.length; i++) {
			f1 = map[i][0];
			if (fx < f1) {
				var f = (fx - f2)/(f1 - f2);
				var col1 = map[i][1];
				var col2 = map[i-1][1];
				var col = [
					Fn.lerp(col2[0], col1[0], f),
					Fn.lerp(col2[1], col1[1], f),
					Fn.lerp(col2[2], col1[2], f),
					Fn.lerp(col2[3], col1[3], f)
				];
				return col;
			}
			f2 = f1;
		}
		return map[map.length-1][1];
	};
	Star.prototype.setRadius = function(r) {
		this.radius = r;
		this.radius2 = this.radius*this.radius;
	};
	Star.prototype.updateMass = function() {
		// mass = density*volume
		this.mass = Star.c4pi*this.radius2*this.radius*this.density/3;
	};
	Star.prototype.updateRadius = function() {
		// radius = mass/density/volume
		this.radius = Math.pow(3*this.mass/this.density/4/Math.PI, 1/3);
		this.radius2 = this.radius*this.radius;
	};
	Star.prototype.updateEnergy = function() {
		// E = m*c^2
		this.energy = this.mass*Star.cC2;
	};
	Star.prototype.updateByMass = function() {
		this.updateRadius();
		this.updateEnergy();
	};
	Star.prototype.updateByRadius = function() {
		this.updateMass();
		this.updateEnergy();
	};
	Star.prototype.updateByEnergy = function() {
		this.mass = this.energy / Star.cC2;
		this.updateRadius();
	};
	Star.prototype.update = function(frame, dt) {
		// update position: dp = v*dt
		this.pos[0] += this.v[0]*dt;
		this.pos[1] += this.v[1]*dt;
		// update velocity: dv = a*dt
		this.v[0] += this.a[0]*dt;
		this.v[1] += this.a[1]*dt;
		// reset acceleration, it is re-calculated at the next iteration
		this.a[0] = 0;
		this.a[1] = 0;
		// energy loss is proportional to the surface
		var s = 0*0.07*0.3333*Star.cC*Star.c4pi*this.radius2;
		this.energy -= s;
		// energy cannot be negaive
		if (this.energy < 0) this.energy = 0;
		this.updateByEnergy();
		return this.energy;
	};
	Star.radiusFactor = (function(){ return Math.pow(4, 0.2); })();
	Star.prototype.render = function(frame, ctx) {
		// a*x^5 = 1 => x^5 = 1/a => x = pow(1/a, 1/5) = pow(a, -1/5)
		var r = this.radius;
		var x = this.pos[0];
		var y = this.pos[1];
		// ctx.beginPath();
		// ctx.fillStyle = 'rgb(' + this.getColorFromEnergy() + ')';
		// ctx.arc(x, y, r, 0, 2*Math.PI);
		// ctx.fill();
		var col = this.getColorFromEnergy();
		for (var i=4; i>=0; i--) {
			ctx.beginPath();
			ctx.fillStyle = 'rgb(' + col + ')';
			ctx.arc(x, y, r, 0, 2*Math.PI);
			col[3] *= 0.2;
			r = r * Star.radiusFactor;
			ctx.fill();
		}
	};
	Star.prototype.toString = function() {
		return [
			'mass:     ' + (1000*this.mass).toFixed(4),
			'energy:   ' + this.energy.toFixed(4),
			'radius:   ' + this.radius.toFixed(4),
			'position: ' + this.pos[0].toFixed(4)+' | '+this.pos[1].toFixed(4)
		].join();
	};
	
	Star.c4pi = 4*Math.PI;
	Star.cC = 30000;
	Star.cC2 = Star.cC*Star.cC;
	Star.MAX_ENERGY = 10000;
	
	public(Star, 'Star');

})();