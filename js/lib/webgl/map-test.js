var gl = null;
var g = {};
function onPageLoad() {
    //*********************************************************
	// initialize engine
	GE.init(fw.Config.app.settings, 'canvasContainer');
	if (GE.gl == null) {
		Dbg.prln('webGL not supported!');
		return;
	}
	gl = GE.gl;
	GE.canvas.lockPointer = GE.canvas.requestPointerLock || 
							GE.canvas.mozRequestPointerLock ||
							GE.canvas.webkitRequestPointerLock;
	document.exitPointerLock =  document.exitPointerLock ||
								document.mozExitPointerLock ||
								document.webkitExitPointerLock;
	
	GE.setInputCallback(readInput);

	$('canvasContainer').appendChild($('info'));
    //*********************************************************
	// set up extensions
	var ext = GE.gl_getExtension(['OES_texture_float', 'OES_standard_derivatives']);
	if (ext.length > 0) {
		Dbg.prln('Required extension(s) not supported:');
		Dbg.prln(ext.join('\n'));
		return;
	}
//	var extensions = gl.getSupportedExtensions();
//	Dbg.prln(extensions.join('\n'));

    //*********************************************************
	// set up the scene
    g.w = parseInt(fw.Config.app.settings.lx), g.h = parseInt(fw.Config.app.settings.ly);
    g.vx = 2*Math.PI*parseFloat(fw.Config.app.settings.vx), g.vy = 2*Math.PI*parseFloat(fw.Config.app.settings.vy);
    g.amp = parseFloat(fw.Config.app.settings.amp);

	createScene();
	
//	gl.viewport(0, 0, GE.canvas.clientWidth, GE.canvas.clientHeight);

    //*********************************************************
	// set up rendering
    gl.clearColor(0.3, 0.5, 0.9, 1);
    gl.clearDepth(10000);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
//    gl.enable(gl.CULL_FACE);
//    gl.cullFace(gl.FRONT_AND_BACK);
    
    //*********************************************************
    // start main loop
    GE.start();
}

function createScene() {
	// create a model group
	g.modelGrp01 = new ModelGroup('vshader', 'fshader', ['vPosition', 'vTexCoord']);
	// set shader program parameters
	g.modelGrp01.modelMatrixLoc = GE.gl.getUniformLocation(g.modelGrp01.prg, "modelMatrix");
	GE.gl_viewProjectionMatrixLoc = GE.gl.getUniformLocation(g.modelGrp01.prg, "viewProjectionMatrix");
	g.lightDirLoc = GE.gl.getUniformLocation(g.modelGrp01.prg, "lightDir");
	g.directLight = [0, -1, 0];
	GE.gl.uniform3fv(g.lightDirLoc, g.directLight);
	g.angleLoc = GE.gl.getUniformLocation(g.modelGrp01.prg, "angle");
	GE.gl.uniform1f(GE.gl.getUniformLocation(g.modelGrp01.prg, "vx"), g.vx);
	GE.gl.uniform1f(GE.gl.getUniformLocation(g.modelGrp01.prg, "vy"), g.vy);
//	GE.gl.uniform1f(GE.gl.getUniformLocation(g.modelGrp01.prg, "amp"), g.amp);
//	GE.gl.uniform1i(GE.gl.getUniformLocation(g.modelGrp01.prg, "colorMap"), 1);
//	GE.gl.uniform2iv(GE.gl.getUniformLocation(g.modelGrp01.prg, "heightMapSize"), new Int32Array([g.w, g.h]));

	// model #1: terrain 
	var vertices = [];
	var indices = [];
	var texCoords = [];
	g.heightMap1 = new Float32Array(new ArrayBuffer(4*g.w*g.h));
	g.heightMap2 = new Float32Array(new ArrayBuffer(4*g.w*g.h));

	var w = g.w-1, h = g.h-1;
	var ix = 0;
	for (var j=0; j<=h; j++) {
		for (var i=0; i<=w; i++) {
			var x = (i - w/2), z = (j - h/2);
			vertices.push(x, 0, z);
			texCoords.push(i/w, j/w);
			if (i < w && j < h) {
				var i1=i+j*g.w, i2=i1+1, i3=i1+g.w, i4=i3+1;
				indices.push(i1, i2, i4);
				indices.push(i1, i4, i3);
			}
			g.heightMap1[ix] = 0.0, g.heightMap2[ix++] = 0.0;
			/*g.amp*Math.sin(g.vx*j/h)*Math.cos(g.vy*i/w)*/
		}
	}

	g.terrain = new Model({vertices:vertices, indices:indices, texCoords:texCoords});
	g.modelGrp01.addModel(g.terrain);
	// texture #1: height map
	g.heightMap = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, g.heightMap);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, g.w, g.h, 0, gl.LUMINANCE, gl.FLOAT, g.heightMap1);
	gl.uniform1i(GE.gl.getUniformLocation(g.modelGrp01.prg, "heightMap"), 0);
	gl.bindTexture(gl.TEXTURE_2D, null);
	g.modelGrp01.textures.push(g.heightMap);
	g.modelGrp01.lock();

	// add a third person camera
	var r = Math.max(w, h);
	var arg = 2*Math.PI/360*45;
	new GE.gl_TPCamera([0, 0, 5], [0, 0, 0]);
	GE.gl_setCamera(0);
}

var mouseLocked = false;

function readInput(e) {
	var oEvt = Events.getEvent(e);
	var tgt = oEvt.target;
	switch (oEvt.name) {
		case 'mousedown':
			break;
		case 'mouseup':
			 mouseLocked = !mouseLocked;
			 if (mouseLocked) {
				 GE.canvas.lockPointer();
			 } else {
				 document.exitPointerLock();
			 }
			break;
//		case 'oncontextmenu'
//			GE.inputs.mlb &= 255;
//			break;
		case 'mousemove':
			if (mouseLocked) {
				var dx = e.movementX || e.mozMovementX;
				var dy = e.movementY || e.mozMovementY;
				var r = false;
//				if (dx > 0) { GE.gl_activeCamera.rot[1] += 0.8; r = true; }
//				else if (dx < 0) { GE.gl_activeCamera.rot[1] -= 0.8; r = true; }
//				if (dy > 0) { GE.gl_activeCamera.rot[0] += 0.5; r = true; }
//				if (dy < 0) { GE.gl_activeCamera.rot[0] -= 0.5; r = true; }
//				if (r) {
//					GE.gl_activeCamera.update();
//				}
//				if (dx > 0) { GE.gl_activeCamera.lookAt[1] += 0.8; r = true; }
//				else if (dx < 0) { GE.gl_activeCamera.rot[1] -= 0.8; r = true; }
//				if (dy > 0) { GE.gl_activeCamera.rot[0] += 0.5; r = true; }
//				if (dy < 0) { GE.gl_activeCamera.rot[0] -= 0.5; r = true; }
//				if (r) {
//					GE.gl_activeCamera.update();
//				}

			}
		break;
	}
}

function processInput() {
	var r = false;
	if (GE.inputs.keys[65] != 0) { GE.gl_activeCamera.pos[0] -= 0.5; r = true; }
	if (GE.inputs.keys[68] != 0) { GE.gl_activeCamera.pos[0] += 0.5; r = true; }
	if (GE.inputs.keys[76] != 0) { GE.gl_activeCamera.pos[1] -= 0.5; r = true; }
	if (GE.inputs.keys[79] != 0) { GE.gl_activeCamera.pos[1] += 0.5; r = true; }
	if (GE.inputs.keys[87] != 0) { GE.gl_activeCamera.pos[2] -= 0.5; r = true; }
	if (GE.inputs.keys[83] != 0) { GE.gl_activeCamera.pos[2] += 0.5; r = true; }
	if (r) {
		//gl.uniform3fv(g.lightDirLoc, g.directLight);
		//var arg = Math.atan(GE.gl_activeCamera.pos[1] / GE.gl_activeCamera.pos[2]);
		//$('info').innerHTML = arg + ', ' + GE.gl_activeCamera.pos[1]/Math.sin(arg);
		GE.gl_activeCamera.update();
	}
	if (GE.inputs.keys[82]) {
		f2 = 0;
		g.heightMap1.fill(0.0);
	}
}

var currentAngle = 0;
var scale = new Float32Array( [0, 0] );
var f2 = 0;
function update(f) {
    currentAngle += 0.1;
    if (currentAngle > 2*Math.PI) {
        currentAngle -= 2*Math.PI;
    }
    gl.uniform1f(g.angleLoc, currentAngle);
	//gl.uniform3f(g.lightDirLoc, Math.cos(currentAngle), Math.sin(currentAngle), 0);

    var changed = false;
    var mod = 6;
    if (f2 < 200 && ((f2 % mod) == 0)) {
    	noise(f2/mod+1);
    	changed = true;
    }
    mod = 29;
    if (f2 < 100 && ((f2 % mod) == 0)) {
    	shift(f2/mod+1);
    	changed = true;
    }
    mod = 13;
    if (f2 < 200 && ((f2 % mod) == 0)) {
    	average();
    	changed = true;
    }

    if (changed) {
    	setHeightMap();
    }
	f2++;

    //gl.uniform3fv(gl.getUniformLocation(g.prg, "random"), new Float32Array([Math.random(), Math.random(), Math.random()]));
   
//    var vx = g.vx*Math.sin(currentAngle);
//    var vy = g.vy*Math.sin(currentAngle);
//    gl.uniform1f(gl.getUniformLocation(g.prg, "vx"), vx);
//    gl.uniform1f(gl.getUniformLocation(g.prg, "vy"), vy);
}

function render(f) {
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    //gl.uniform1i(gl.getUniformLocation(g.prg, "frame"), f);
    
    g.modelGrp01.render();
}


var hills = 6.0;
/*****************************************************************************/
function noise(f) {
	var w = Math.floor(g.w/f);
	var h = Math.floor(g.h/f);
	var s = hills * Math.pow(0.82, f);
	for (var j=0; j<f; j++) {
		for (var i=0; i<f; i++) {
			var v = s*(2*Math.random()-1);
			for (var y=j*h; y<j*h+h && y < g.h; y++) {
				for (var x=i*w; x<i*w+w && x<g.w; x++) {
					g.heightMap1[x + y*g.w] += v;
				}
			}
		}
	}
}
/*****************************************************************************/
function shift(f) {
	var x1 = Math.floor(Math.random()*g.w);
	var y1 = Math.floor(Math.random()*g.h);
	var m = 2*Math.random() - 1;
	var s = hills*(5*Math.random()-1)*Math.pow(0.9, f)/10;
	var ix = 0;
	for (var j=0; j<g.h; j++) {
		for (var i=0; i<g.w; i++) {
			var y = m*(i-x1) + y1;
			var h = g.heightMap1[ix];
			if (j - y < 0) {
				 h = h - s;
			} else {
				h = h + s;
			}
			g.heightMap1[ix] = h;
			ix++;
		}
	}
}
var filter = [
	[ 0.6, 1.0, 0.6],
	[ 1.0, 1.0, 1.0],
	[ 0.6, 1.0, 0.6]
];

/*****************************************************************************/
function average() {
	for (var i=0; i<g.w; i++) {
		for (var j=0; j<g.h; j++) {
			var h = 0, q = 0;
			for (var k=-1; k<2; k++) {
				var y = j+k;
				if (y < 0 || y >= g.h) continue;
				for (var l=-1; l<2; l++) {
					var x = i+l;
					if (x < 0 || x >= g.w) continue;
					var f = filter[l+1][k+1];
					h += f * g.heightMap1[x + y*g.w];
					q += f;
				}
			}
			h /= q;
			g.heightMap2[i + j*g.w] = h;
		}
	}

	var tmp = g.heightMap1;
	g.heightMap1 = g.heightMap2;
	g.heightMap2 = tmp;
}

function setHeightMap() {
    gl.bindTexture(gl.TEXTURE_2D, g.heightMap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, g.w, g.h, 0, gl.LUMINANCE, gl.FLOAT, g.heightMap1);
    gl.bindTexture(gl.TEXTURE_2D, null);
}