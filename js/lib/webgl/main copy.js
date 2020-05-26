include('dbg.js');
include('ge.js');
include('v3.js');
include('m4.js');
include('sphere.js');
include('webgl.js');
include('noise.js');
include('fn.js');

var gl = null;
var pt = [];
var count = 10000;
var eyePosition = new V3(0, 0, -6.0);
var lookAtDir = new V3(0, 0, 1.0);
var width = 400;
var height = 300;
var vertexDataCount = 6;
var ambientColor_ = Float32Array.from([0.04, 0.06, 0.10, 1.0]);

var lights_ = [
	{ 'color': [0.4, 0.5, 0.8], 'radius': 4.0, 'period': 6.0, 'sn': 8, 'axis': (new V3(1.0, 2.0, -1.0)).norm() },
	{ 'color': [0.5, 0.8, 0.4], 'radius': 2.8, 'period': 8.0, 'sn': 8, 'axis': (new V3(0.0, 0.0, 1.0)).norm() },
	{ 'color': [0.8, 0.5, 0.4], 'radius': 3.5, 'period': 5.0, 'sn': 8, 'axis': (new V3(2.0, 5.0, 2.0)).norm() },
];
var ns = new Noise(13);
var mapNoise = (x, y) => ns.fbm2d(0.5*(1+x), 0.5*(1+y), 7, 0.84, 1.02, 0.48, 3.98);
var mapChecked = (x, y) => (Math.round(x*18)%2) * (Math.round(y*18)%2);
function xform0(x, y, z) {
	return [x, y, z];
}
function xform1(x, y, z) {
	var amp = 0.8 + 0.2*Math.sin(1.5*2*Math.PI*y)*Math.cos(1.5*2*Math.PI*x)*Math.cos(1.5*2*Math.PI*z);
	return [amp*x, amp*y, amp*z];
}
function xform2(x, y, z) {
	var amp = (0.9 + 0.1 * Sphere.map(x, y, z, mapNoise));
	return [amp*x, amp*y, amp*z];
}
function xform3(x, y, z) {
	x = Fn.quantize(x, 8);
	y = Fn.quantize(y, 8);
	//z = quantize(z, 8);
	return [x, y, z];
}
function xform21(x, y, z) {
	var d = (0.9 + 0.1 * Sphere.map(x, y, z, mapChecked));
	x = d*x;
	y = d*y;
	z = d*z;
	return [x, y, z];
}

var spheres_ = [
/*
	{ 'color': [0.2, 0.2, 0.4], 'position': [-1.0, -1.5,  0.0],
	 'period': 4.0, 'axis': (new V3(0.0, 1.0, 0.0)).norm(),
	 'sc': [0.5, 0.5, 0.47], 'sn': 180, 'xf':xform0 },
	{ 'color': [0.2, 0.4, 0.2], 'position': [1.0, -1.5,  0.5],
	 'period': 4.5, 'axis': (new V3(0.0, 1.0, 1.0)).norm(),
	 'sn': 60, 'xf':xform1 },
	{ 'color': [0.4, 0.2, 0.2], 'position': [0.0,  1.0, -0.5],
	 'period': 5.3, 'axis': (new V3(1.0, 1.0, 0.0)).norm(),
	 'sn': 80, 'xf':xform3 },
	{ 'color': [0.8, 0.2, 1.0], 'position': [2.0,  1.0, -1.5],
	 'period': 6.0, 'axis': (new V3(0.0, 1.0, -0.5)).norm(),
	 'sn': 80, 'xf':xform21 },
*/
	{ 'color': [1.0, 1.0, 1.0], 'position': [0.0,  0.0, 0.0],
	 'period': 2.0, 'axis': (new V3(1.0, 1.0, 0.0)).norm(),
	 'sc': [1.5, 1.50, 1.5], 'sn': 6, 'xf0':xform1, 'tex': 0 }
];

var textures_ = [];

var programs_ = [];

var mdlGrp_ = null;


function loadPrograms() {
	var shaders = load([
		{ 'url':'v1.glsl', 'contentType':'x-shader/x-vertex' },
		{ 'url':'f1.glsl', 'contentType':'x-shader/x-fragment' },
	]);
	shaders.forEach(s => { if (s instanceof Error) throw s;});

	programs_.push(webGL.createProgram(gl,
		shaders,
		{
			'aPos': { 'type':gl.FLOAT, 'size':3 },
			'aNormal': { 'type':gl.FLOAT, 'size':3 },
			'aTex0': { 'type':gl.FLOAT, 'size':2 }
		},
		{
			'uGlobalColor':	{ 'type': webGL.FLOAT4V },
			'uProjection':	{ 'type': webGL.FLOAT4x4M },
			'uModel':		{ 'type': webGL.FLOAT4x4M },
			'uView':		{ 'type': webGL.FLOAT4x4M },
			'uDTime':		{ 'type': webGL.FLOAT },
			'uAmbientColor': { 'type': webGL.FLOAT4V },
			'uLightPos1':	{ 'type': webGL.FLOAT4V },
			'uLightPos2':	{ 'type': webGL.FLOAT4V },
			'uLightPos3':	{ 'type': webGL.FLOAT4V },
			'uLightColor1':	{ 'type': webGL.FLOAT4V },
			'uLightColor2':	{ 'type': webGL.FLOAT4V },
			'uLightColor3':	{ 'type': webGL.FLOAT4V },
			'uScreenSize':	{ 'type': webGL.FLOAT2V }
		}
	));
	shaders = load([
		{ 'url':'v2.glsl', 'contentType':'x-shader/x-vertex' },
		{ 'url':'f2.glsl', 'contentType':'x-shader/x-fragment' },
	]);
	shaders.forEach(s => { if (s instanceof Error) throw s;});

	programs_.push(webGL.createProgram(gl,
		shaders,
		{
			'aPos': { 'type':gl.FLOAT, 'size':3 },
			'aNormal': { 'type':gl.FLOAT, 'size':3 }
		},
		{
			'uProjection':	{ 'type': webGL.FLOAT4x4M },
			'uModel':		{ 'type': webGL.FLOAT4x4M },
			'uView':		{ 'type': webGL.FLOAT4x4M },
			'uDTime':		{ 'type': webGL.FLOAT },
			'uGlobalColor':	{ 'type': webGL.FLOAT4V }
		}
	));
}

function addLights() {
	for (var i=0; i<lights_.length; i++) {
		var sphere = new Sphere(24, 1.0, 24, 0.0, 1.0, webGL.VERTEX_ATTRIB_POSITION | webGL.VERTEX_ATTRIB_NORMAL, xform1);
		lights_[i].model = sphere;
		sphere.program = programs_[1];
		sphere.config = lights_[i];
		var s =0.2;
		sphere.scale = [s, s, s];
		lights_[i].color.forEach( (x, i) => sphere.color[i] = x );
		sphere.getUniforms = sphere.getUniformsOrbit;
		mdlGrp_.add(sphere);
	}
}

function addSpheres() {
	for (var i=0; i<spheres_.length; i++) {
		var sn = spheres_[i].sn || 90;
		var xform = spheres_[i].xf || xform0;
		var flags = webGL.VERTEX_ATTRIB_POSITION | webGL.VERTEX_ATTRIB_NORMAL;
		if (typeof spheres_[i].tex === 'number') flags |= webGL.VERTEX_ATTRIB_TEXTURE1;
		var sphere = new Sphere(sn, 1.0, sn, 0.0, 1.0, flags, xform);
var dt=sphere.vertexData;
for (var j=0; j<dt.length; j+=8) {
	Dbg.prln(dt[j].toFixed(4)+','+dt[j+1].toFixed(4)+','+dt[j+2].toFixed(4)+' '+dt[j+6].toFixed(4)+','+dt[j+7].toFixed(4));
}
		sphere.program = programs_[0];
		sphere.config = spheres_[i];
		sphere.scale = spheres_[i].sc || [0.5, 0.5, 0.5];
		spheres_[i].color.forEach( (x, i) => sphere.color[i] = x );
		mdlGrp_.add(sphere);
	}
}

function addBackground() {
	var mdl = new Model('back',
		[-10.0, -10, -5.0,   10.0, -10, -5.0,
		  10.0,  10, -5.0,  -10.0,  10, -5.0 ],
		[0, 2, 1,  1, 2, 3],
		webGL.VERTEX_ATTRIB_POSITION
	);
	mdlGrp.add(mdl);
}

function prepareScene() {
/*
	vertices = new Float32Array(4*vertexDataCount*count);
	for (var i=0; i<count; i++) {
		var p1 = {m:1, id:i};
		pt.push(p1);
		reset(p1);
	}
*/
	var texture0 = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture0);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, createGridTexture(256, 32)); 
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, createNoiseTexture(256)); 
	gl.generateMipmap(gl.TEXTURE_2D);
	textures_.push(texture0);
	gl.bindTexture(gl.TEXTURE_2D, null);

	mdlGrp_ = new ModelGroup('grp1');
	loadPrograms();
	addSpheres();
	//addLights();
	//addBackground();
	var plane = new Model('plane', [1,1,0, 1,1,0, 0,0,  -1,1,0, -1,1,0, 1,0,  1,-1,0, 1,-1,0, 0,1,  -1,-1,0, -1,-1,0, 1,1], [0,1,2, 1,3,2], webGL.VERTEX_ATTRIB_POSITION | webGL.VERTEX_ATTRIB_NORMAL | webGL.VERTEX_ATTRIB_TEXTURE1);
	plane.program = programs_[0];
	//sphere.config = spheres_[i];
	plane.scale = [1.0, 1.0, 1.0];
	plane.color = [0.1, 0.1, 0.1, 1.0];
	plane.getUniforms = function(uniforms) {
		var dt = uniforms['frame'] * 0.03;
		uniforms['uGlobalColor'] = this.color;
		var scale = M4.scaleV(this.scale);
		//var rot = M4.rotate(this.config.axis, dt*2*Math.PI/this.config.period);
		uniforms['uModel'] = scale.mul(M4.translate(3, 0, -1)).data;
	};
	mdlGrp_.add(plane);

	
	mdlGrp_.getUniforms = function(uniforms) {
		//uniforms['uScreenSize'] = [width, height];
		//var projection = M4.perspective(-4.0, 4.0, -3.0, 3.0, 0.01, 100.0);
		var projection = M4.perspectiveFov(60*Math.PI/180, width/height, 0.01, 100.0);
		//var projection = M4.orthogonal(-1.0, 1.0, -1.0, 1.0, 0.01, 100.0);
		var dt = uniforms['frame'] * 0.03;
		uniforms['uProjection'] = projection.data;
		uniforms['uDTime'] = dt;
		//uniforms['uView'] = M4.lookAt(eye, new V3(0, 0, 0), new V3(0, 1, 0)).data;
		uniforms['uView'] = M4.lookAt(eyePosition, eyePosition.add(lookAtDir), new V3(0, 1, 0)).data;

		for (var i=0; i<lights_.length; i++) {
			var light = lights_[i];
			if (light.model) {
				uniforms['uLightPos' + (i+1)] = light.model.position;
				uniforms['uLightColor' + (i+1)] = light.model.color;
			}
		}
		uniforms['uAmbientColor'] = ambientColor_;
		//[GE.inputs.mpos[0]/width, 1-GE.inputs.mpos[1]/height, 0.0, 1.0];
	};
	mdlGrp_.lock();
	
	count = mdlGrp_.vertexCount;

	gl.clearColor(
		ambientColor_[0], ambientColor_[1],
		ambientColor_[2], ambientColor_[3]);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CW);
	gl.cullFace(gl.BACK);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function updateVBO() {
	return;
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function render(fm) {
	//Dbg.prln('render '+fm);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.bindTexture(gl.TEXTURE_2D, textures_[0]);
	mdlGrp_.render(fm);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

function processInputs() {
	var arrows = GE.readArrows();
	var dp = new V3();
	if (arrows[0] != 0) {
		dp.x -= arrows[0]*0.1;
		//Dbg.prln('arr-x: ' + arrows[0]);
	}
	if (arrows[1] != 0) {
		dp.z -= arrows[1]*0.1;
		//Dbg.prln('arr-y: ' + arrows[1]);
	}

	var rotY = GE.inputs.delta[0] * 0.05;
	var rotX = GE.inputs.delta[1] * 0.05;	// * height/width;
	var m = M4.identity();
	if (rotX != 0.0) {
		m = M4.rotate(new V3(1, 0, 0), rotX*2*Math.PI/180);
	}
	if (rotY != 0.0) {
		m = m.mul(M4.rotate(new V3(0, 1, 0), rotY*2*Math.PI/180));
	}
	//eyePosition.inc(new V3(m.mulV(dp)));
	//lookAtDir = m.mulV(lookAtDir);
}

function reset(pt, stop) {
	var id = pt.id;
	var ix = id*vertexDataCount;
	var v = null;
	var pos = new V3();

	if (!stop) {
		pt.m = 1;
		// create coordinates
		var le = (count-id)/count;
		pos = V3.fromPolar(
			2*Math.PI*Math.random(),
			2*Math.PI*Math.random(),
			1// - Math.pow(le, 4)*Math.random()
		);
		//pos = new V3(2*Math.random()-1, 2*Math.random()-1, 2*Math.random()-1);
		// create velocity vectors
		v = V3.fromPolar(
			2*Math.PI*Math.random(),
			2*Math.PI*Math.random(),
			Math.random()*0.2
		);
	} else {
		pt.m = 0;
		v = new V3();
	}
	// var o = new V3(-.5, -.5, -.5);
	// pos.inc(o).scale(2.0);
	vertices[ix+0]=pos.x;
	vertices[ix+1]=pos.y;
	vertices[ix+2]=pos.z;
	vertices[ix+3]=v.x;
	vertices[ix+4]=v.y;
	vertices[ix+5]=v.z;

	// create acceleration vector?
}

function lookUpColor(tix, v) {
	var tbl = [
		[
			[1.0, 255, 255, 255, 255],
			[0.9, 255, 255, 255, 255],
			[0.8, 255, 240, 128, 255],
			[0.6, 240,  64,  64, 128],
			[0.4,  64,  64,  64,  64],
			[0.0,   0,   0,   0,   0]
		],
		[
			[1.0, 255, 255, 255, 255],
			[0.9, 255, 255, 255, 255],
			[0.8, 128, 160, 240, 255],
			[0.7,  64,  64, 192, 128],
			[0.5,  64,  64,  64,  64],
			[0.0,   0,   0,   0,   0]
		]
	];

	
	var col = [0, 0, 0, 0];
	var tab = tbl[tix];
	var i0 = tab[0];
	for (var i=1; i<tab.length; i++) {
		var i1 = tab[i];
		if (v > i1[0]) {
			var r = (v - i1[0])/(i0[0] - i1[0]);
			for (var j=0; j<4; j++) {
				col[j] = Math.floor(r*(i0[j+1] - i1[j+1]) + i1[j+1]);
				//col[j] = i1[j+1];
			}
			break;
		}
		i0 = i1;
	}
	return col;
}

var ns_ = new Noise(23);
function createNoise(imgData, width, height, depth, dt) {
	var z = (dt % depth)/depth;
	for (var j=0; j<height; j+=2) {
		var y = j/height;
		var cy = y - 0.5;
		y += 3*dt/depth;
		for (var i=0; i<width; i+=2) {
			var ix = 4*(i + j*width);
			var x = i/width;
			var cx = x - 0.5;// if (cx == 0) cx = 2.000001;
			var r = Math.sqrt(cx*cx + cy*cy);
			//var v = ns.fbm1d(x, 6, 0.67, 4.3, .52, 3.98);
			//var v = ns_.fbm2d(x, y, 3, 0.67, 4.3, .52, 2.98);
			var v = 1.16*ns.fbm3d(x, y, z, 7, 0.77, 2.02, .48, 2.92);
			//var fd = 1.0 - Math.sqrt(cx*cx + cy*cy);
			var fd = 1.0;	//Math.sqrt(cx*cx + cy*cy);
			fd = Fn.smoothstep(fd*fd);
			v = v * fd;
			var col = lookUpColor(1, Fn.clamp(v, 0.0, 1.0));
			imgData[ix+0] = col[0];
			imgData[ix+1] = col[1];
			imgData[ix+2] = col[2];
			imgData[ix+3] = col[3]/2;
		}
	}
}
function createNoiseTexture(dim) {
	var imgData = new Uint8Array(dim*dim*4);
	createNoiseTexture(imgData, dim, dim, dim, 0);
	return imgData;
}

function createGridTexture(dim, unit) {
	var imgData = new Uint8Array(dim*dim*4);
	for (var j=0; j<dim; j+=1) {
		var c = 64;
		for (var i=0; i<dim; i+=1) {
			var ix = 4*(i + j*dim);
			if (i%unit == 0) c += Math.floor(unit*(255-64)/256);
			var v = (i%unit != 0 && j%unit != 0) ? c : 255;
			imgData[ix+0] = c;
			imgData[ix+1] = c;
			imgData[ix+2] = c;
			imgData[ix+3] = c;
		}
	}
	return imgData;
}

var ctx_ = null;
var imgData_ = null;
function renderFire(fm) {
	createNoise(imgData_.data, imgData_.width, imgData_.height, 256, 0.2*fm);
	ctx_.putImageData(imgData_, 0, 0);
}

window.onload = () => {
	try {
		Dbg.init('con');
		GE.init('cvs');
		GE.T = 40;
		
		Dbg.prln('start...');
		var cvs = document.querySelector('#cvs');
		var cnt = document.querySelector('#cvs-container');
		cvs.style.width = cnt.clientWidth + 'px';
		cvs.style.height = cnt.clientHeight + 'px';
		width = cvs.width = cnt.clientWidth/2;
		height = cvs.height = cnt.clientHeight/2;
		con.style.width = '0px';
		con.style.width = (cnt.clientWidth - con.offsetWidth) + 'px';

		// gl = webGL.init(cvs);
		// if (gl == null) throw new Error('webGL not supported!');
		// prepareScene();
		GE.processInputs = processInputs;
		//GE.update = update;
		ctx_ = cvs.getContext('2d');
		imgData_ = ctx_.getImageData(0, 0, width, height);
		GE.render = renderFire;
		processInputs();
		GE.start();

	} catch (error) {
		Dbg.prln(error.message);
		Dbg.prln(error.stack);
	}
};