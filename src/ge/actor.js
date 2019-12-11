(function() {
	function Actor() {
		this.position = new V3();
		this.velocity = new V3();
		//this.acceleration = new V3();
		this.mass = this.massR = 1.0;
		// callbacks to apply forces
		// Actor::callback(V3 force out)
		this.forces = [];
		// callback to check constrains
		// Actor::callback(V3 dp)
		this.constraints = [];
	}
	Actor.prototype.setMass = function(m) {
		this.mass = m;
		this.massR = 1.0/m;
	};
	Actor.prototype.update = function(dt) {
		// sum forces
		var f = new V3();
		for (var i=0; i<this.forces.length; i+=2) {
			this.forces[i+1].call(this.forces[i], this, f);
		}
		// calculate acceleration, velocity and position
		// a = F/m
		var a = f.scale(this.massR);
		// dp = v*dt + 0.5*a*dt*dt
		var dv = a.mulC(dt);
		var dp = this.velocity.mulC(dt).inc(dv.mulC(.5*dt));
		var dpOut = new V3(dp);
		// check constrains of position
		for (var i=0; i<this.constraints.length; i+=2) {
			this.constraints[i+1].call(this.constraints[i], this, dp, dpOut);
		}
//Dbg.prln('dpOut: ' + dpOut  );
		// p = p + dp
		this.position.inc(dpOut);
		// v = v + a*dt
		this.velocity.inc(dv);
	};
	Actor.prototype.addForce = function(obj, method) {
		this.forces.push(obj, method);
	};
	Actor.prototype.addConstraint = function(obj, method) {
		this.constraints.push(obj, method);
	};
	public(Actor, 'Actor');
})();