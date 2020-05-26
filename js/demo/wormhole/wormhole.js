include('/ge/fn.js');
include('/ge/math/v3.js');
include('/ge/noise.js');

(function() {
    function Wormhole(canvas) {
        Demo.call(this, 'Wormhole', canvas);
        this.isChanged = true;
		this.noise = new Noise();
		this.rings = [];
		this.lastRing = null;
		this.cursorPos = new V3();

        
    }
    extend(Demo, Wormhole);

    Wormhole.prototype.prepare = async function() {
    };
    Wormhole.prototype.initialize = function() {
		this.onresize();
		var ring = null;
		for (var ri=0; ri<this.data.rings; ri++) {
			ring = this.createRing(ri);
			this.rings.push(ring);
		}
		this.lastRing = ring;
    };
    // Wormhole.prototype.createUi = function(node) {
    // };
    Wormhole.prototype.processInputs = function() {
		this.getMouseCoors(this.cursorPos);
		// if (GE.inputs.target == GE.front)
		// {
		// 	_mouseActive = true;
		// 	// get mouse delta
		// 	var offset = GE.offset();
		// 	_cursorPos.x = GE.inputs.pos[0] - offset[0];
		// 	_cursorPos.y = GE.inputs.pos[1] - offset[1];
		// } else
		// {
		// 	_mouseActive = false;
		// }
	};
    Wormhole.prototype.update = function(frame, dt) {
		// var cx, cy;
		// if (_mouseActive) {
		// 	cx = _cursorPos.x/_settings.width - 0.5;
		// 	cy = _cursorPos.y/_settings.height - 0.5;
		// } else {
		// 	cx = _rings[0][0] - (_rings[0][0] - 1.5*Math.cos(f/10))/25;
		// 	cy = _rings[0][1] - (_rings[0][1] - 1.5*Math.sin(f/10)*Math.cos(f/10))/25;
		// }

		for (var ri=0; ri<this.rings.length; ri++) {
			var ring = this.rings[ri];
			var f = ring.pos.z/this.rings.length;	// f *= f;
			ring.pos.x = Fn.lerp(this.cursorPos.x, ring.pos.x, f);
			ring.pos.y = Fn.lerp(this.cursorPos.y, ring.pos.y, f);
			ring.pos.z -= this.data.time;
			if (ring.pos.z < 0) {
				// reset ring
				var c = Math.floor(Math.random()*8);
				var r = c & 1 ? 255 : 100;
				var g = c & 2 ? 255 : 100;
				var b = c & 4 ? 255 : 100;
				ring.color = [r, g, b];
				ring.pos.set(this.lastRing.pos);
				ring.pos.z++;
				this.lastRing = ring;
			}
		}
	};
    Wormhole.prototype.render = function(frame, dt) {
		// erase background
		GE.ctx.fillStyle = '#0e1028';
		GE.ctx.fillRect(0, 0, GE.canvas.width, GE.canvas.height);

		var angleDiff = 2*Math.PI / this.data.segments;
		// paint rings
		var rix = this.lastRing.ix;
		for (var ri=0; ri<this.rings.length; ri++) {
			var ring = this.rings[rix];
			var zf = 1 - this.data.aspect * ring.pos.z/this.rings.length;
			var radius = this.data.radius * zf;
			var z = zf;
			var r = Math.floor(ring.color[0] * z);
			var g = Math.floor(ring.color[1] * z);
			var b = Math.floor(ring.color[2] * z);
			GE.ctx.strokeStyle = '#' + ('00'+r.toString(16)).substr(-2) + ('00'+g.toString(16)).substr(-2) + ('00'+b.toString(16)).substr(-2);
			GE.ctx.beginPath();
			for (var si=1; si<=this.data.segments; si++) {
				var cx1 = ring.pos.x + radius * Math.cos((si-1) * angleDiff);
				var cy1 = ring.pos.y + radius * Math.sin((si-1) * angleDiff);
				var cx2 = ring.pos.x + radius * Math.cos(si * angleDiff);
				var cy2 = ring.pos.y + radius * Math.sin(si * angleDiff);
				GE.ctx.moveTo(cx1, cy1);
				GE.ctx.lineTo(cx2, cy2);
			}
			GE.ctx.stroke();

			rix--;
			if (rix < 0) rix += this.rings.length;
		}


		// var dst = GE.frontContext.getImageData(0, 0, _settings.width, _settings.height);
		// var stride = _settings.width*4;
		// var fi = Math.PI*Math.sin(f/100);
		// var angleDiff = 2*Math.PI/_dots;
		// var rad = _radius;
		// for (var r=0;r<_rings.length;r++)
		// {
		// 	for (var d=0;d<_dots;d++)
		// 	{
		// 		//rad = 0.5*_radius/(_rings[r][2]+0.5);
		// 		var x = _rings[r][0] + _settings.radius*Math.cos(fi);
		// 		var y = _rings[r][1] + _settings.radius*Math.sin(fi);
		// 		x = x/(_rings[r][2]+1.0);
		// 		y = y/(_rings[r][2]+1.0);
		// 		fi += angleDiff;
		// 		if ((x > -0.5) && (x < 0.5) &&
		// 			(y > -0.5) && (y < 0.5))
		// 		{
		// 			var ix = Math.floor(_settings.height*(y+0.5))*stride + Math.floor(_settings.width*(x+0.5))*4;
		// 			dst.data[ix+0] = _rings[r][4][0];
		// 			dst.data[ix+1] = _rings[r][4][1];
		// 			dst.data[ix+2] = _rings[r][4][2];
		// 			var af = _rings[r][2]*0.5;
		// 			dst.data[ix+3] = Math.floor(255/(af*af+1));
		// 		}
		// 	}
		// }
        //GE.frontBuffer.blit();
    };
    Wormhole.prototype.onchange = function(setting) {
        // this.onresize();
        // switch (setting.dataField) {
        //     case 'width':
        //     case 'height':
        //         this.onresize();
        //         break;
        // }
	};
    Wormhole.prototype.createRing = function(ix) {
		var c = Math.floor(Math.random()*8);
		var r = c & 1 ? 255 : 127;
		var g = c & 2 ? 255 : 127;
		var b = c & 4 ? 255 : 127;
		var ring = {
			ix: ix,
			pos: new V3(0, 0, ix + 1),
			color: [r, g, b]
		};
		return ring;
	};
    // Wormhole.prototype.onresize = function() {
    //     //GE.resizeCanvas(this.data.width, this.data.height);
    //     this.buffers[0] = GE.frontBuffer;
    //     this.buffers[1] = GE.backBuffer;
	// };
	Wormhole.prototype.getMouseCoors = function(v) {
		v.x = GE.inputs.mpos[0] * GE.canvas.width/GE.canvas.clientWidth;
		v.y = GE.inputs.mpos[1] * GE.canvas.height/GE.canvas.clientHeight;
	};

    public(Wormhole, 'Wormhole');

})();
