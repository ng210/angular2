include('/demo/dots/segment.js');
include('/ge/actor.js');
include('/ge/fn.js');

(function() {

function Dot() {
	Actor.call(this);
	this.color = '#e0d080';
	this.r = Dot.pSize/2;
	this.constructor = Dot;
}
Dot.prototype = new Actor();

Dot.prototype.setColor = function(col) {
	this.color = '#'
	 + ('00'+col[0].toString(16)).slice(-2)
	 + ('00'+col[1].toString(16)).slice(-2)
	 + ('00'+col[2].toString(16)).slice(-2);
	var col2 = [
		Fn.clamp(Math.floor(col[0]*1.2), 0, 0xff),
		Fn.clamp(Math.floor(col[1]*1.2), 0, 0xff),
		Fn.clamp(Math.floor(col[2]*1.2), 0, 0xff)
	];
	this.color2 = '#'
	+ ('00'+col2[0].toString(16)).slice(-2)
	+ ('00'+col2[1].toString(16)).slice(-2)
	+ ('00'+col2[2].toString(16)).slice(-2);
};

Dot.prototype.render = function(ctx) {
	var d = 2*this.r;
	GE.ctx.globalAlpha = 1.0;
	GE.ctx.fillStyle = this.color2;
	GE.ctx.fillRect(this.position.x - this.r, this.position.y - this.r, d, d);
	GE.ctx.globalAlpha = 0.05;
	GE.ctx.fillStyle = this.color;
	var r = d*2;
	d = 2*r;
	GE.ctx.fillRect(this.position.x - r, this.position.y - r, d, d);
	GE.ctx.globalAlpha = 0.01;
	GE.ctx.fillStyle = this.color2;
	var r = d*1.3;
	d = 2*r;
	GE.ctx.arc(this.position.x - r, this.position.y - r, r, 0, 0);
}
Dot.pSize = 1;

Dots.Dot = Dot;

})();