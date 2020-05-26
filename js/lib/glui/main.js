include('base/dbg.js');
include('ge/bin-tree.js');

function App(canvasId) {
    GE.init('#cvs', GE.MODE_WEBGL2);
    //this.canvas = document.getElementById(canvasId);
    //this.ctx = this.canvas.getContext('webgl2');
    this.console = document.getElementById('con');

    this.resources = null;

    this.controls = [];
    this.binTree = new GE.BinaryTree(2, GE.canvas.width, GE.canvas.height);
}

App.prototype.initialize = async function initialize() {
	this.resources = await load([
		{ url: `/glui/default.vs`, contentType: 'x-shader/x-vertex', shaderType: gl.VERTEX_SHADER },
		{ url: `/glui/default.fs`, contentType: 'x-shader/x-fragment', shaderType: gl.FRAGMENT_SHADER }
    ]);
    var errors = [];
    for (var i=0; i<this.resources.length; i++) {
        if (this.resources[i].error != null) errors.push(this.resources[i].error);
    }
	if (errors.length > 0) {
		throw new Error('Error loading resources!\n' + errors.join());
    }
    
    this.preparePass1();
};

App.prototype.preparePass1 = function preparePass1() {
    var positions = [];
    for (var i=0; i<this.binTree.nodes.length; i++) {
        var node = this.binTree.nodes[i];
        positions.push(
            node.left, node.top,
            node.left + node.width, node.top,
            node.left + node.width, node.top + node.height,
            node.left, node.top + node.height
        );
    }

	this.quads = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.quads);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, true, 0, 0);

	// // create texure
	// var texture = gl.createTexture();
	// gl.bindTexture(gl.TEXTURE_2D, texture);
	// gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.resources[3]);
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	// gl.generateMipmap(gl.TEXTURE_2D);
	// this.uniforms.uFontSize.value[0] = this.fontData.width;
	// this.uniforms.uFontSize.value[1] = this.fontData.height;
	// this.uniforms.uFontSize.value[2] = this.fontData.size;

	var shaders = {};
	shaders[gl.VERTEX_SHADER] = this.resources[0];
	shaders[gl.FRAGMENT_SHADER] = this.resources[1];
	this.program = webGL.createProgram(gl, shaders, { position:{type:gl.FLOAT, size:4} }, this.uniforms);
	gl.useProgram(this.program.prg);
	// set initial uniforms
	this.program.setUniforms();
};



App.prototype.render = function render() {
	gl.clearColor(0.0, 0.1, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // render binary tree
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);


    for (var i=0; i<this.binTree.nodes.length; i++) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle='#ffffff';
        ctx.fillRect(cx, cy, width, height);

    }
};

App.prototype.resize = function resize() {
	var left = 0;
	var width = window.innerWidth;
	var height = window.innerHeight;
	GE.canvas.style.width = (width - left) + 'px';
	GE.canvas.style.height = height + 'px';
	this.console.style.top = '75vh';
	this.console.style.width = '100vw';
};

async function onpageload() {
	try {
		Dbg.init('con');

        var app = new App('cvs');
        app.resize();
        await app.initialize();
        app.render();

	} catch (error) {
		Dbg.prln(error.stack);
	}
};
