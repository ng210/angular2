include('/ge/fn.js');

(function() {

    function Rotozoom(canvas) {
		Demo.call(this, 'rotozoom', canvas);
		this.images = [];
		this.cx = 0;
		this.cy = 0;
		this.counter = 0;
		this.zoom = 0;
		this.angle = 0;

		this.constructor = Rotozoom;
    }
	Rotozoom.prototype = new Demo;

    Rotozoom.prototype.prepare = async function() {
		// create list of images
		var urls = [
			'/demo/lens/lens.gif', '/demo/lens/deepspace.jpg',
			'/demo/fire/fire.gif', '/demo/rotozoom/javascript.gif',
			'/test/test.gif'
		];
		var res = await load(urls);
		for (var i=0; i<res.length; i++) {
			if (!(res[i].error instanceof Error) && res[i].node instanceof Image) {
				var url = res[i].resolvedUrl;
				var ix = url.lastIndexOf('/') + 1;
				res[i].node.alt = url.substring(ix != 0 ? ix : 0);
				this.images.push(res[i].node);
			}
		}
		this.ui.controls.images.setItems(this.images.map(v => v.alt));
	};
	Rotozoom.prototype.setImage = function() {
		var ix = this.ui.controls.images.getSelectedItem().index;
		var img = this.images[ix];
		GE.backBuffer.ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, GE.backBuffer.width, GE.backBuffer.height);
		GE.backBuffer.update();
	};
	Rotozoom.prototype.initialize = function() {
		this.cx = GE.frontBuffer.width/2;
		this.cy = GE.frontBuffer.height/2;
	};
	Rotozoom.prototype.renderUi = function(node) {
		Demo.prototype.renderUi.call(this, node);
		this.setImage();
	};	
    Rotozoom.prototype.processInputs = function(e) {
	};
	Rotozoom.prototype.onchange = function(setting) {
		switch (setting.dataField) {
			case 'images':
				this.setImage();
				break;
		}
	};
    Rotozoom.prototype.update = function(frame, dt) {
		this.counter += this.data.time * dt;
		var zoom = 2 * Math.sin(this.counter) * this.data.zoom;
		var angle = 3 * Math.cos(this.counter) * this.data.rotation;
		var src = GE.backBuffer;
		var dst = GE.frontBuffer;
		var stride = src.width*4;
		var di = 0;
		for (var y=0; y<GE.frontBuffer.height; y++) {
			for (var x=0; x<GE.frontBuffer.width; x++) {
				// rotation
				var cos = Math.cos(angle);
				var sin = Math.sin(angle);
				var cx = (this.cx + (x - this.cx) * cos - (y - this.cy) * sin) * zoom;
				cx = cx % src.width;
				if (cx < 0) cx += src.width;
				var ix = Math.floor(cx);
				var fx = cx - ix;
				var cy = (this.cy + (x - this.cx) * sin + (y - this.cy) * cos) * zoom;
				cy = cy % src.height;
				if (cy < 0) cy += src.height;
				var iy = Math.floor(cy);
				var fy = cy - iy;
				var si11 = ix*4 + iy*stride;
				var si12 = ((ix+1) % src.width)*4 + iy*stride;
				var si21 = ix*4 + ((iy+1) % src.height)*stride;
				var si22 = ((ix+1) % src.width)*4 + ((iy+1) % src.height)*stride;
				var fx1 = fx, fx2 = 1 - fx;
				var fy1 = fy, fy2 = 1 - fy;
				for (var ci=0; ci<3; ci++) {
					var v = 0;
					switch (this.data.interpolation) {
						case 'none':
							v = src.imgData.data[si11+ci];
							break;
						case 'h-linear':
							v = fx2*src.imgData.data[si11+ci] + fx1*src.imgData.data[si12+ci];
							break;
						case 'v-linear':
							v = fy2*src.imgData.data[si11+ci] + fy1*src.imgData.data[si21+ci];
							break;
						case 'bilinear':
							var v1 = fx2*src.imgData.data[si11+ci] + fx1*src.imgData.data[si12+ci];
							var v2 = fx2*src.imgData.data[si21+ci] + fx1*src.imgData.data[si22+ci];
							v = fy2*v1 + fy1*v2;
							break;
					}
					dst.imgData.data[di+ci] = v;
				}
				dst.imgData.data[di+3] = 255;
				di += 4;
			}
		}
	};
    Rotozoom.prototype.render = function(frame) {
		GE.frontBuffer.blit();
	};
    Rotozoom.prototype.onresize = function(e) {
	};
	// Rotozoom.prototype.getMouseCoors = function(v) {
	// 	v.x = GE.inputs.mpos[0] * GE.canvas.width/GE.canvas.clientWidth;
	// 	v.y = GE.inputs.mpos[1] * GE.canvas.height/GE.canvas.clientHeight;
	// };

	public(Rotozoom, 'Rotozoom');
})();
