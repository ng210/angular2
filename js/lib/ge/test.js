include('noise.js');

var a_ = [];
var canvas_ = null;
var settings_ = null;
var ACTORCOUNT = 100;
var SEGMENTCOUNT = 6;
var segmentOffset_ = 0;
var GAPCOUNT = 0;
var GAPSIZE = 1;
var RESOLUTION = 2;
var aspect_ = 0;
var elasticity_ = 0.0;
var segmentList_ = [];

function createSegmentList() {
	var noise = new Noise();
	// add bottom line
	var dx = 2.0*aspect_/100;
	var dy = 0.4*(noise.fbm1d(0, 5, 0.47, 1.95, 0.52, 2.03) - 0.5);
	var p1 = new V3(-aspect_, 0.75 + dy, 0);
	for (var i=0; i<100; i++) {
		//var dy = 0.1*Math.random() - 0.05;
		var dy = 0.4*(noise.fbm1d(i/20, 4, 0.47, 1.95, 0.52, 2.03) - 0.5);
		var p2 = new V3(p1.x + dx, 0.75 + dy, 0);
		//p1 = new V3(1.8*(Math.random() - 0.5), 1.8*(Math.random() - 0.5), 0);
		// var p2 = V3.fromPolar(0, 2*Math.PI*Math.random(), 0.3).inc(p1);
		var s = p1.x < p2.x ? {a:p1, b:p2} : {a:p2, b:p1};
		s.d = s.b.sub(s.a);
		segmentList_.push(s);
		p1 = p2;
	}
	// add random platforms
	for (var i=0; i<10; i++) {
		var p1 = new V3(aspect_*1.8*(Math.random() - 0.5), Math.random() - 0.5, 0);
		var p2 = V3.fromPolar(0, 0.333*Math.PI*(Math.random() - 0.5), 0.3).inc(p1);
		var s = p1.x < p2.x ? {a:p1, b:p2} : {a:p2, b:p1};
		s.d = s.b.sub(s.a);
		//segmentList_.push(s);
		p1 = p2;
	}

	segmentOffset_ = segmentList_.length;
	var r = 0.4;
	var df = 2*Math.PI/SEGMENTCOUNT;
	var g = Math.floor((SEGMENTCOUNT - GAPSIZE*GAPCOUNT)/GAPCOUNT);
	var gi = g;
	for (var i=0; i<SEGMENTCOUNT; i++) {
		if (gi > 0) {
			var p1 = V3.fromPolar(0, i*df, r*(0.8 + 0.2*noise.fbm1d(i/5, 5, 0.47, 1.95, 0.52, 2.03)));
			var p2 = V3.fromPolar(0, i*df+df, r*(0.8 + 0.2*noise.fbm1d((i+1)/5, 5, 0.47, 1.95, 0.52, 2.03)));
			var s = p1.x < p2.x ? {a:p1, b:p2} : {a:p2, b:p1};
			s.d = s.b.sub(s.a);
			segmentList_.push(s);
			gi--;
		} else {
			gi = g;
			i += GAPSIZE;
		}
	}
}

function MyActor() {
	Actor.call(this);
	this.color = '#e0d080';
	this.topLeft = new V3(-aspect_ + .02, -0.98, 0);
	this.bottomRight = new V3(aspect_ - .02, .98, 0);
	
}
MyActor.prototype = new Actor();

MyActor.prototype.checkVectors_ = function(dp, dpOut) {
	var u = {a:this.position, b:this.position.add(dp)};
	// ensure u.a.x < u.b.x
	if (dp.x < 0) {
		u.a = u.b;
		u.b = this.position;
	}

	var found = false;

	for (var i=0; i<vectorList_.length; i++) {
		var v = vectorList_[i];
		// check intersection of v and u
		// case1
		// u1-----u2
		//            x1--x2
		// u2 < x1
		// case2
		// x1---x2
		//          u1-----u2
		// x2 < u1

		// case 1 and 2
		if (v.b.x < u.a.x || v.a.x > u.b.x) continue;
		// same for y, y is not sorted

		var vy1 = 0, vy2 = 0;
		if (v.a.y < v.b.y) {
			vy1 = v.a.y;
			vy2 = v.b.y;
		} else {
			vy1 = v.b.y;
			vy2 = v.a.y;
		}

		var uy1 = 0, uy2 = 0;
		if (u.a.y < u.b.y) {
			uy1 = u.a.y;
			uy2 = u.b.y;
		} else {
			uy1 = u.b.y;
			uy2 = u.a.y;
		}
		if (vy2 < uy1 || vy1 > uy2) continue;

		// check intersection
		// get slope
		var dux = u.a.x - u.b.x;
		var c1 = [0, 0];
		if (dux != 0) {
			// y = a1*x + b1
			c1[0] = dux/(u.a.y - u.b.y);
			var b1 = u.a.y - a1*u.a.x;
			// x = 1/a1*y - b1/a1
		} else {
			// x = 0*y + b1
			var b1 = u.a.x;
		}
		var dvx = v.a.x - v.b.x;
		if (dvx != 0) {
			// y = a1*x + b1
			var a1 = (v.a.y - v.b.y)/dux;
			var b1 = v.a.y - a1*v.a.x;
			// x = 1/a1*y - b1/a1
		} else {
			// x = 0*y + b1
			var b1 = u.a.x;
		}
		
		var a2 = (v.a.y - v.b.y)/dvx;
		// get y offset from one of the 2 points
		// y = a1*x + b1, y = a2*x + b2
		
		var b2 = v.a.y - a2*v.a.x;
		var x = (b2 - b1)/(a1 - a2);
		var y = a1*x + b1;
		if (u.a.x <= x && x <=u.b.x &&
			uy1 <= y && y <=uy2) {
			// get distance from section
			found = true;
			// get new direction vector

			dpOut.x = 0;
			dpOut.y = 0;
			this.velocity.x = 0;
			this.velocity.y = 0;
			break;
		}
	}
	//this.color = found ? '#ff8080' : '#80ff80';
};

function intersect(v, u) {
	var dv = v.d;
	var du = u.d;
    var d = dv.x * du.y - du.x * dv.y; // cross2d(dv, du)
    var dvu = v.a.sub(u.a);
    var s = (dv.x * dvu.y - dv.y * dvu.x) / d; // cross2d(dv, dvu)
    var t = (du.x * dvu.y - du.y * dvu.x) / d; // cross2d(du, dvu)
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        // Collision detected
        return new V3(v.a.x + (t * dv.x), v.a.y + (t * dv.y), 0);
    }
    return null;
}
MyActor.prototype.checkVectors = function(dot, dp, dpOut) {
	var u = {a:dot.position, b:dot.position.add(dp)};
	u.d = u.b.sub(u.a);
	for (var i=0; i<segmentList_.length; i++) {
		var v = segmentList_[i];
		var p = intersect(v, u);
		if (p != null) {
			// calculate reflection direction: norm(up-2*dot(up, vn)*vn)
			var up = p.sub(u.a);
			var vn = new V3(-v.d.y, v.d.x, 0).norm();
			var dir = up.sub(vn.scale(2*up.dot(vn))).norm();
			var s = u.b.sub(p).length();
			// dpOut = up + dir*s
			dpOut.set(up.inc(dir.mulC(s)));
			//dpOut.x = 0, dpOut.y = 0;
			// velocity = dir*velocity.length
			dot.velocity = dir.scale(dot.velocity.length()*elasticity_);
dpOut.set(up.scale(0.99));
			dot.velocity.x = 0, dot.velocity.y = 0;
			break;
		}
	}
};

MyActor.prototype.respawn = function(checkX, checkY) {
	if (checkX !== false || checkY !== false) {
		this.position.x = 0.02*aspect_*(Math.random() - 0.5);
		this.position.y = 0.02*(Math.random() - 0.5);
		this.velocity = V3.fromPolar(0, 2*Math.PI*Math.random(), 1.0 + 0.0*Math.random());
		this.color = colors_[Math.floor(Math.random()*colors_.length)];
	}
};
MyActor.prototype.rebound = function(checkX, checkY) {
	if (checkX) this.velocity.x *= -elasticity_;
	if (checkY) this.velocity.y *= -elasticity_;
};

MyActor.prototype.checkBox = function(dot, dp, dpOut) {
	var pos = dot.position.add(dp);
	var d1 = pos.sub(dot.topLeft);
	var d2 = dot.bottomRight.sub(pos);
	var checkX = false, checkY = false;
	if (d1.x < 0) {
		dpOut.x = -d1.x;
		checkX = true;
	} else if (d2.x < 0) {
		dpOut.x = -d2.x;
		checkX = true;
	}
	if (d1.y < 0) {
		dpOut.y = -d1.y;
		checkY = true;
	} else if (d2.y < 0) {
		checkY = true;
		dpOut.y = -d2.y;
	}
	dot.rebound(checkX, checkY);
	//this.respawn(checkX, checkY);
};

function gravity(dot, force) {
	force.y += 0.3;
}
var center = new V3(.0, .0, .0);
function attraction(force) {
	var v = center.sub(this.position).norm();
	var d = v.len2;
	if (d < 0.001) d = 0.001;
	force.inc(v.scale(-0.0001*1000/d));
}

function friction(dot, force) {
	force.scale(0.15);
}

var rotation_ = 2.0*Math.PI/40;
var delta_ = 0;
function update(fr, dt) {
	delta_ += rotation_*dt;
	var dr = 0.2*Math.sin(delta_);
	var cosdr = Math.cos(dr);
	var sindr = Math.sin(dr);

	for (var i=segmentOffset_; i<segmentList_.length; i++) {
		var s = segmentList_[i];
		// rotate
		var x = cosdr*s.a.x - sindr*s.a.y;
		var y = sindr*s.a.x + cosdr*s.a.y;
		s.a.x = x; s.a.y = y;
		var x = cosdr*s.b.x - sindr*s.b.y;
		var y = sindr*s.b.x + cosdr*s.b.y;
		s.b.x = x; s.b.y = y;
		if (s.a.x > s.b.x) {
			var t = s.a;
			s.a = s.b;
			s.b = t;
		}
		s.d = s.b.sub(s.a);
	}

	for (var i=0; i<a_.length; i++) {
		a_[i].update(dt*2.0);
	}
}

var pSize_ = 0;
function render(fr) {
	// erase background
	GE.ctx.fillStyle = '#0e1028';
	GE.ctx.fillRect(-aspect_, -1.0, 2*aspect_, 2);
	// paint platforms
	this.ctx.strokeStyle = '#a0e060';
	this.ctx.beginPath();
	for (var i=0; i<segmentList_.length; i++) {
		var v = segmentList_[i];
		this.ctx.moveTo(v.a.x, v.a.y);
		this.ctx.lineTo(v.b.x, v.b.y);
	}

	this.ctx.stroke();
	// paint balls
	var ps = pSize_/2;
	for (var i=0; i<a_.length; i++) {
		this.ctx.fillStyle = a_[i].color;
		GE.ctx.fillRect(a_[i].position.x - ps, a_[i].position.y - ps, pSize_, pSize_);
	}
}

var segments = [
	{ a:new V3(-0.5, -0.5), b:new V3(0.5, -0.5) },
	{ a:new V3(-0.5, 0.5), b:new V3(0.5, 0.5) },
	{ a:new V3(-0.5, -0.5), b:new V3(-0.5, 0.5) },
	{ a:new V3(0.5, -0.5), b:new V3(0.5, 0.5) }
];
var colors_ = [
	'#ff8080', '#80ff80', '#8080ff', '#ffff80',
	'#80ffff', '#808080', '#ff80ff', '#ffffff'
];
function test(cb) {
	Dbg.prln(cb.name);
	var re = [];
	GE.ctx.fillStyle = '#0e1028';
	GE.ctx.fillRect(-aspect_, -1.0, 2.0*aspect_, 2.0);
	for (var i=0; i<segments.length; i++) {
		var v = segments[i];
		
		GE.ctx.strokeStyle = colors[i % colors.length];
		GE.ctx.beginPath();
		GE.ctx.moveTo(v.a.x, v.a.y);
		GE.ctx.lineTo(v.b.x, v.b.y);
		GE.ctx.stroke();
	}
/*
	for (var si=0; si<segments.length; si++) {
		var u = segments[si];
		var p = {x:0, y:0};
		re.push(si + ': ');
		for (var i=0; i<segments.length; i++) {
			if (i == si) continue;
			var v = segments[i];
			re.push(cb(u, v, p) == 1 ? (p.x.toPrecision(4) + '|' + p.y.toPrecision(4)) : 'none');
		}
		re.push('<br/>')
	}
*/
	return re;
}

function intersectOrig(v, u, out) {
	var p0_x = v.a.x, p0_y = v.a.y;
	var p1_x = v.b.x, p1_y = v.b.y;
	var p2_x = u.a.x, p2_y = u.a.y;
	var p3_x = u.b.x, p3_y = u.b.y;

	var s1_x, s1_y, s2_x, s2_y;
    s1_x = p1_x - p0_x; s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x; s2_y = p3_y - p2_y;

    var s, t;
    var d = s1_x * s2_y - s2_x * s1_y;
    s = (s1_x * (p0_y - p2_y) - s1_y * (p0_x - p2_x)) / d;
    t = (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / d;

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
    {
        // Collision detected
        out.x = p0_x + (t * s1_x);
        out.y = p0_y + (t * s1_y);
        return 1;
    }

    return 0; // No collision
}

function test_stream() {
	var stream = new Stream(4);
	stream.writeUint8(72);
	stream.writeString('ello');
	stream.writeUint8(32);
	stream.writeString('World!');

	var str = [];
	var chars = new Uint8Array(stream.buffer.slice(0, stream.cursor));
	chars.forEach(x => str.push(String.fromCharCode(x)));
	if (str.join('') != 'Hello World!') throw new Error('Stream test failed!');
}

window.onload = e => {
	try {

	canvas_ = document.querySelector('#cvs');
    settings_ = document.querySelector('#settings');
    settings_.style.zIndex = 1000;
    var cnt = document.querySelector('#cvs-container');
    canvas_.width = cnt.clientWidth/RESOLUTION;
    canvas_.style.width = cnt.clientWidth + 'px';
    canvas_.height = cnt.clientHeight/RESOLUTION;
    canvas_.style.height = cnt.clientHeight + 'px';
	Dbg.init('con', canvas_.width);
    Dbg.con.style.width = cnt.clientWidth - 20; //cnt.style.borderWidth;
    Dbg.con.style.top = (cnt.clientHeight/2 - 10) + 'px';
    Dbg.con.style.fontWeight = 500;
	Dbg.con.style.fontSize = 20;
	Dbg.con.style.color= 'yellow';
	Dbg.prln('ge tests');
	GE.init(canvas_);
GE.T = 40;
Dbg.prln(GE.ctx.canvas.width + '|' + GE.ctx.canvas.height);
	aspect_ = canvas_.width/canvas_.height;
	GE.ctx.setTransform(canvas_.height/2, 0, 0, canvas_.height/2, canvas_.width/2, canvas_.height/2);
	pSize_ = 2/canvas_.height;
	GE.ctx.lineWidth = pSize_;

	createSegmentList();

	for (var i=0; i<ACTORCOUNT; i++) {
		a_[i] = new MyActor();
		a_[i].setMass(10.0);
		a_[i].respawn();
		// add callbacks
		//a_[i].forces.push(this, gravity);
		//a_[i].forces.push(attraction);
		//a_[i].forces.push(this, friction);
		a_[i].constraints.push(this, MyActor.prototype.checkVectors);
		a_[i].constraints.push(this, MyActor.prototype.checkBox);
	}

	Dbg.prln('actor created.');
	//GE.T = 200;
	GE.update = update;
	GE.render = render;
	
	GE.start();

	} catch (error) {
		alert(error.stack);
	}
};
