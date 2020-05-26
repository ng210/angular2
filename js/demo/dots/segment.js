(function() {

function Segment(u, v) {
	//if (u.x < v.x) {
		this.a = u;
		this.b = v;
	// } else {
	// 	this.a = v;
	// 	this.b = u;
	// }
	this.d = this.b.sub(this.a);
	
	
}

function cross2d(u, v) {
	return u.x*v.y - u.y*v.x;
}

Segment.prototype.intersect = function(u) {
	var p = null;
	var d = cross2d(this.d, u.d);
	if (d != 0) {
		var dvu = this.a.sub(u.a);
		var s = cross2d(this.d, dvu);
		var t = cross2d(u.d, dvu);
		if (d < 0) {
			s = -s; t = -t; d = -d;
		}
		if (s >= 0 && s < d && t >= 0 && t < d) {
			p = new V3(this.a.x + (t * this.d.x)/d, this.a.y + (t * this.d.y)/d, 0);
		}
	}
    return p;
}

public(Segment, 'Segment');

})();