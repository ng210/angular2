include('/demo/gravity/star.js');
(function() {
	
    function Gravity(canvas) {
		Demo.call(this, 'gravity', canvas);
		this.stars = [];
		this.count = 0;
		this.canvas.width = 600;
		this.canvas.height = 400;
		this.lastTime = new Date().getTime();
		this.ctx = canvas.getContext('2d');

		// this.ctx.scale(300, 200);
		// this.ctx.translate(1.0, 1.0);

		this.sun = new Star();
		this.sun.pos[0] = this.sun.pos[1] = 0;
		this.sun.radius = 0.1;
		this.sun.updateByRadius();
		this.stars.push(this.sun);
        this.constructor = Gravity;
    }
	Gravity.prototype = new Demo;

    Gravity.prototype.prepare = async function() {
		return true;
	};
	Gravity.prototype.initialize = function() {
		this.count = this.data.count || 50;
		//this.settings.stars = this.count;
		this.sun.setRadius(this.data.sun);
		this.sun.updateByRadius();

		if (this.count < this.stars.length) {
			for (var i=this.count; i<this.stars.length; i++) {
				this.stars[i].energy = 0;
			}
		} else {
			for (var i=this.stars.length; i<this.count; i++) {
				var star = new Star();
				this.resetStar(star);
				this.stars.push(star);
			}
		}
		Star.MAX_ENERGY = Math.pow(10, this.data.maxEnergy);
	};
	Gravity.prototype.processInputs = function(e) {
	};
    Gravity.prototype.resolveCollision = function(a, b, d) {
		if (a.mass < b.mass) {
	    	// swap to make a the heavier one
	    	var c = a; a = b; b = c;
    	}
		// calculate velocity from momentum
		// l = m1*v1 + m2*v2
		// v = l/(m1+m2)
		var lx = a.mass*a.v[0] + b.mass*b.v[0];
		var ly = a.mass*a.v[1] + b.mass*b.v[1];
		a.energy += b.energy;
		a.updateByEnergy();
		a.v[0] = lx/a.mass; a.v[1] = ly/a.mass;
		if (this.sun.mass < a.mass) {
			this.sun = a;
		}
		this.resetStar(b);
		//Dbg.prln(a.toString());
    };
    Gravity.prototype.update = function(frame) {
		var time = new Date().getTime();
		var timeWarp = this.data.time;
		var g = this.data.force;
		// update position and velocity
		for (var i=0; i<this.count; i++) {
			var star1 = this.stars[i];
			for (var j=i+1; j<this.count; j++) {
				var star2 = this.stars[j];
				var dx = star2.pos[0] - star1.pos[0], dy = star2.pos[1] - star1.pos[1];
				// F = f*(m1+m2)/d^2
				// a1 = f*m2/d^2*n = f*n/d^2 * m2
				// a2 = f*m1/d^2*n = f*n/d^2 * m1
				// n = (dx/d, dy/d) = (dx, dy)/d
				// f*n/d^2 = f/d^3*(dx, dy)
				var d2 = dx*dx + dy*dy;
				var d = Math.sqrt(d2);
				if (d < star1.radius + star2.radius) {
					this.resolveCollision(star1, star2, d);
					break;
				}
				var f = g/d/d2;
				dx *= f; dy *= f;
				star1.a[0] += star2.mass*dx; star1.a[1] += star2.mass*dy;
				star2.a[0] += -star1.mass*dx; star2.a[1] += -star1.mass*dy;
			}
		}
		for (var i=0; i<this.count; i++) {
			if (!this.stars[i].update(frame, (time - this.lastTime)*timeWarp)) {
				this.resetStar(this.stars[i]);
			}
		}
		this.lastTime = time;
	};
	Gravity.prototype.resetStar = function(star) {
		star.reset();
//Dbg.prln('reset');
		if (this.data.orbit) {
			var d = 2*this.sun.radius + 0.5 * Math.random();
			var a = this.data.force * this.sun.mass / d / d;
			var v = Math.sqrt(a*d);
			var arg = 2*Math.PI * Math.random();
			star.v[0] = -v*Math.sin(arg);
			star.v[1] = v*Math.cos(arg);
			star.pos[0] = this.sun.pos[0] + Math.cos(arg)*d;
			star.pos[1] = this.sun.pos[1] + Math.sin(arg)*d;
			//Dbg.prln(d);
		}
	};
    Gravity.prototype.render = function(frame) {
		this.ctx.setTransform(300, 0, 0, 300, 300, 200);
		// this.ctx.scale(300, 200);
		// this.ctx.translate(1.0, 1.0);

		this.ctx.fillStyle = '#0e1028';
		this.ctx.fillRect(-1.0, -1.0, 2.0, 2.0);
		//this.ctx.fillStyle = '#f0e080';
		//this.ctx.strokeStyle = '#a0e060';
		this.ctx.lineWidth = 2;
    	for (var i=0; i<this.count; i++) {
			var star = this.stars[i];
			star.render(frame, this.ctx);
		}
	};
    Gravity.prototype.onchange = function(setting) {
		this.initialize();
	};

    public(Gravity, 'Gravity');

})();