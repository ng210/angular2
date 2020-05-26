include('/ge/math/v3.js');
include('/ge/noise.js');

(function() {
	
	function Dots(canvas) {
		Demo.call(this, 'dots', canvas);
		this.aspect = 0;
		this.fbmSize = 50;
		this.PlatformCount = 4;
		this.WheelSegmentCount = 100;
		this.WheelRadius = 0.05
		this.GapCount = 10;
		this.GapSize = 0.1;
		this.segmentOffset = 0;
		this.segments = [];
		this.dots = [];
		this.topLeft = null;
		this.bottomRight = null;
		this.center = new V3(.0, .0, .0);
		//this.pSize = 0.01;
		this.colors = [
			[0xff,0x80,0x80], [0x80,0xff,0x80], [0x80,0x80,0xff], [0xff,0xff,0x80],
			[0x80,0xff,0xff], [0x80,0x80,0x80], [0xff,0x80,0xff], [0xff,0xff,0xff]
		];
		this.noise = new Noise();
		this.lastMousePosition = new V3();
		this.mode = 0;
		
	}
	extend(Demo, Dots);

	Dots.prototype.prepare = async function() {
		await load('/demo/dots/dot.js');
	};
	Dots.prototype.initialize = function() {
		settings_.style.width = '16em';
		this.onresize();
		this.createSegmentsFromFbm();
		this.createPlatforms();
		this.segmentOffset = this.segments.length;
		this.createSegmentWheel();

		for (var i=0; i<this.data.count; i++) {
			this.dots[i] = new Dots.Dot();
			this.dots[i].setMass(5.0*Math.random()+5.0);
			this.respawn(this.dots[i]);
			// add callbacks
			this.dots[i].addForce(this, this.gravity);
			this.dots[i].addForce(this, this.attraction);
			this.dots[i].addForce(this, this.friction);
			this.dots[i].addConstraint(this, this.checkVectors);
			this.dots[i].addConstraint(this, this.checkBox);
		}
		//GE.ctx.globalCompositeOperation = ...
	};
	Dots.prototype.processInputs = function(e) {
		if ((GE.inputs.mbuttons & 2) != 0) {
			this.getMouseCoors(this.lastMousePosition);
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
	Dots.prototype.onchange = function(e) {
		switch (e.control.dataField) {
			case 'resolution':
				this.onresize();
				break;
			case 'count':
				var n = e.control.getValue();
				for (var i=this.data.count; i<n; i++) {
					this.dots[i] = new Dots.Dot();
					this.dots[i].setMass(5.0*Math.random()+5.0);
					this.respawn(this.dots[i]);
					// add callbacks
					this.dots[i].addForce(this, this.gravity);
					this.dots[i].addForce(this, this.attraction);
					this.dots[i].addForce(this, this.friction);
					this.dots[i].addConstraint(this, this.checkVectors);
					this.dots[i].addConstraint(this, this.checkBox);
				}
				break;
		}
	};

	var rotation_ = 2.0*Math.PI/40;
	var delta_ = 0;
	Dots.prototype.update = function(frame, dt) {
		// update wheel rotation
		delta_ += rotation_*dt;
		var dr = 0.01*this.data.time*Math.sin(delta_);
		var cosdr = Math.cos(dr);
		var sindr = Math.sin(dr);
	
		for (var i=this.segmentOffset; i<this.segments.length; i++) {
			var s = this.segments[i];
			// rotate
			var x = cosdr*s.a.x - sindr*s.a.y;
			var y = sindr*s.a.x + cosdr*s.a.y;
			s.a.x = x; s.a.y = y;
			var x = cosdr*s.b.x - sindr*s.b.y;
			var y = sindr*s.b.x + cosdr*s.b.y;
			s.b.x = x; s.b.y = y;
			s.d = s.b.sub(s.a);
		}

		for (var i=0; i<this.data.count; i++) {
			this.dots[i].update(this.data.time*dt);
		}
	};
	Dots.prototype.render = function(frame) {
		// erase background
		GE.ctx.fillStyle = '#0e1028';
		GE.ctx.fillRect(-this.aspect, -1.0, 2*this.aspect, 2);
		// paint segments
		GE.ctx.strokeStyle = '#60c080';
		GE.ctx.beginPath();
		for (var i=0; i<this.segments.length; i++) {
			var v = this.segments[i];
			GE.ctx.moveTo(v.a.x, v.a.y);
			GE.ctx.lineTo(v.b.x, v.b.y);
		}
		GE.ctx.stroke();

		// paint dots
		//var ps = this.pSize/2;
		for (var i=0; i<this.data.count; i++) {
			this.dots[i].render(GE.ctx);
		}

		GE.ctx.globalAlpha = 0.3;
		var lineHeigth = 0.05;
		GE.ctx.font = lineHeigth.toPrecision(4) + "px Consolas";
		GE.ctx.fillStyle = "#ffe080";
		GE.ctx.textAlign = "left";
		var ty = 1.0 - lineHeigth;
		GE.ctx.fillText("mode:" + this.mode, -this.aspect, ty.toPrecision(2));
		//GE.ctx.fillText("mpos:" + GE.inputs.mpos + ' buttons: ' + GE.inputs.mbuttons.toString(2), -this.aspect, ty.toPrecision(2));
		GE.ctx.globalAlpha = 1.0;
	};
	Dots.prototype.onresize = function(e) {
		// handler of window resize
		GE.resizeCanvas(1/this.data.resolution);
		var he = GE.canvas.height;
		this.aspect = GE.canvas.width/he;
		GE.ctx.setTransform(he/2, 0, 0, he/2, GE.canvas.width/2, he/2);
		Dots.Dot.pSize = 2/he;
		GE.ctx.lineWidth = Dots.Dot.pSize;

		this.topLeft = new V3(-this.aspect + .05, -0.95, 0);
		this.bottomRight = new V3(this.aspect - .05, .95, 0);

		// if (typeof window.webGL !== 'undefined')
		// 	webGL.resize(gl, width, height);
	
	};
	Dots.prototype.gravity = function(dot, force) {
		force.y += this.data.gravity;
	};
	Dots.prototype.attraction = function(dot, force) {
		var v = this.center.sub(dot.position).norm();
		var d = v.len2;
		if (d < 0.001) d = 0.001;
		force.inc(v.scale(this.data.force/d));
	};
	Dots.prototype.friction = function(dot, force) {
		force.scale(0.15);
	};
	Dots.prototype.createSegmentsFromFbm = function() {
		var dx = 2.0*this.aspect/this.fbmSize;
		var dy = 0.4*(this.noise.fbm1d(0, 5, 0.47, 1.95, 0.52, 2.03) - 0.5);
		var p1 = new V3(-this.aspect, 0.75 + dy, 0);
		for (var i=0; i<this.fbmSize; i++) {
			var dy = 0.4*(this.noise.fbm1d(i/20, 4, 0.47, 1.95, 0.52, 2.03) - 0.5);
			var p2 = new V3(p1.x + dx, 0.75 + dy, 0);
			this.segments.push(new Segment(p1, p2));
			p1 = p2;
		}
	};
	Dots.prototype.createPlatforms = function() {
		for (var i=0; i<this.PlatformCount; i++) {
			var p1 = new V3(this.aspect*1.8*(Math.random() - 0.5), Math.random() - 0.5, 0);
			var p2 = V3.fromPolar(0, 0.333*Math.PI*(Math.random() - 0.5), 0.3).inc(p1);
			this.segments.push(new Segment(p1, p2));
		}
	};
	Dots.prototype.createSegmentWheel = function() {
		var arcCount = this.GapCount;
		var segmentsPerArc = Math.floor(this.WheelSegmentCount/arcCount);
		var totalSegments = this.GapCount*segmentsPerArc;
		var gapSegments = Math.floor(segmentsPerArc * this.GapSize);
		if (this.GapCount == 0) {
			arcCount = 1;
			segmentsPerArc = this.WheelSegmentCount;
			totalSegments = segmentsPerArc;
			gapSegments = 0;
		}
		segmentsPerArc -= gapSegments;
		var df = 2*Math.PI/totalSegments;
		var f = 0;
		for (var j=0; j<arcCount; j++) {
			for (var i=0; i<segmentsPerArc; i++) {
				var p1 = V3.fromPolar(0, f, this.WheelRadius);
				f += df;
				var p2 = V3.fromPolar(0, f, this.WheelRadius);
				this.segments.push(new Segment(p1, p2));
			}
			f += gapSegments*df;
			p1 = V3.fromPolar(0, f, this.WheelRadius);
		}
		// var displace = this.noise.fbm1d(0, 2, 0.47, 3.95, 0.52, 2.03);
		// var p1 = V3.fromPolar(0, f, (0.8 + 0.2*displace) * this.WheelRadius);
		// for (var i=0; i<this.WheelSegmentCount; i++) {
		// 	f += df;
		// 	var displace = this.noise.fbm1d(i/20, 2, 0.47, 3.95, 0.52, 2.03);
		// 	var p2 = V3.fromPolar(0, f+df, (0.5 + 0.5*displace) * this.WheelRadius);
		// 	this.segments.push(new Segment(p1, p2));
		// 	p1 = p2;
		// }
	};
	Dots.prototype.checkVectors = function(dot, dp, dpOut) {
		var u = new Segment(dot.position, dot.position.add(dp));
		for (var i=0; i<this.segments.length; i++) {
			var v = this.segments[i];
			var p = v.intersect(u);
			if (p != null) {
				// calculate reflection direction: norm(up-2*dot(up, vn)*vn)
				var up = p.sub(u.a);
				var vn = new V3(-v.d.y, v.d.x, 0).norm();
				var dir = up.sub(vn.scale(2*up.dot(vn))).norm();
				dot.velocity = dir.scale(dot.velocity.length() * this.data.elasticity);
				var s = u.b.sub(p).length();
				//var dt = (u.b.x - p.x)/dot.velocity.x
				// dpOut = up + dir*s
				dpOut.set(up.inc(dir.mulC(0.1*s)));
				//dpOut.x = 0, dpOut.y = 0;
				//dot.velocity = dir*dot.velocity.length;
				//dot.velocity.x = 0, dot.velocity.y = 0;
				break;
			}
		}
	};	
	Dots.prototype.checkBox = function(dot, dp, dpOut) {
		var pos = dot.position.add(dp);
		var d1 = pos.sub(this.topLeft);
		var d2 = this.bottomRight.sub(pos);
		var checkX = false, checkY = false;
		if (d1.x < 0) {
			dpOut.x -= d1.x;
			checkX = true;
		} else if (d2.x < 0) {
			dpOut.x += d2.x;
			checkX = true;
		}
		if (d1.y < 0) {
			dpOut.y -= d1.y;
			checkY = true;
		} else if (d2.y < 0) {
			checkY = true;
			dpOut.y += d2.y;
		}
		//this.rebound(dot, checkX, checkY);
		this.respawn(dot, checkX, checkY);
	};
	Dots.prototype.respawn = function(dot, checkX, checkY) {
		if (checkX !== false || checkY !== false) {
			switch (this.mode) {
				case 1:
					this.getMouseCoors(dot.position);
					break;
				default:
					dot.position.x = this.lastMousePosition.x;
					dot.position.y = this.lastMousePosition.y;
					break;
			}
			if ((this.mode & 0x02) != 0) {
				var pos = new V3();
				this.getMouseCoors(pos);
				dot.velocity = pos.sub(this.lastMousePosition).scale(0.2 + 0.1*Math.random());
			} else {
				dot.velocity = V3.fromPolar(0, 2*Math.PI*Math.random(), 0.2 + 0.00*Math.random());
			}
			dot.setColor(this.colors[Math.floor(Math.random()*this.colors.length)]);
		}
	};
	Dots.prototype.rebound = function(dot, checkX, checkY) {
		if (checkX)
			dot.velocity.x *= -this.data.elasticity;
		if (checkY)
			dot.velocity.y *= -this.data.elasticity;
	};
	Dots.prototype.getMouseCoors = function(v) {
		v.x = 2*GE.inputs.mpos[0]/this.data.resolution/GE.canvas.height - this.aspect;
		v.y = 2*GE.inputs.mpos[1]/this.data.resolution/GE.canvas.height - 1.0;
	};

	public(Dots, 'Dots');
})();