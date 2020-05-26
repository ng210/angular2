function Model(data) {
	this.group = null;
	this.matrix = new J3DIMatrix4();
	this.IBO_offset = 0;
	this.nIndices = 0;
	// data: {vertices:[], indices:[]}
	this.data = data;
	if (data.texCoords == null) {
		data.texCoords = [];
	}
	// these 2 are DataViews on the ArrayBuffers
	this.VBO = null;
	this.IBO = null;
	this.TBO = null;
}

Model.prototype.update = function(p, r, s) {
	this.matrix.ranslate(p);
	this.matrix.multiply(r);
	this.matrix.multiply(s);
};

Model.prototype.render = function() {
    // upload model matrix
    this.matrix.setUniform(GE.gl, this.group.modelMatrixLoc, false);
    // render model
    GE.gl.drawElements(GE.gl.TRIANGLES, this.nIndices, GE.gl.UNSIGNED_SHORT, this.IBO_offset);
};

//*****************************************************************************
function ModelGroup(vshader, fshader, attributes) {
	this.VBO = null;
	this.IBO = null;
	this.textures = [];
	this.models = [];
	this.nAttributes = attributes.length;
	// create program
	this.prg = GE.gl.createProgram();
	// add shaders
	GE.gl_addShader(this.prg, vshader);
	GE.gl_addShader(this.prg, fshader);
	// add attributes and link shaders
	var prg = GE.gl_finalize(this.prg, attributes);
	if (prg == null) throw 'Shader code has errors!';
	GE.gl.useProgram(this.prg);
}

ModelGroup.prototype.addModel = function(m) {
	this.models.push(m);
	m.group = this;
};

ModelGroup.prototype.lock = function() {
	// create VBO and IBO and create DataViews for the models
	var vCount = 0, iCount = 0, tCount = 0;
	this.models.apply(function(i, args) {
		vCount += this[i].data.vertices.length;
		iCount += this[i].data.indices.length;
		tCount += this[i].data.texCoords.length;
	});
	// create buffers, size given in bytes
	var vertices = new Float32Array(4*vCount);
	var indices = new Uint16Array(2*iCount);
	var texCoords = new Float32Array(4*tCount);
	// merge buffers
	var vOffset = 0, iOffset = 0, tOffset = 0;
	this.models.apply(function(i, args) {
		var d = this[i].data;
		// put vertex data into vertices buffer
		for (var j=0; j<d.vertices.length; j++) {
			// start at vOffset
			vertices[j + vOffset] = d.vertices[j];
		}
		// create a data view in vertices starting at vOffset
		this[i].VBO = new DataView(vertices.buffer, vOffset, d.vertices.length);
		// put index data into indices buffer
		for (var j=0; j<d.indices.length; j++) {
			// start at iOffset, indices are shifted by count of vertices stored previously (=vOffset/3)
			indices[j + iOffset] = d.indices[j] + vOffset/3;
		}
		// create a data view in indices starting at iOffset
		this[i].IBO = new DataView(indices.buffer, iOffset, d.indices.length);
		this[i].nIndices = d.indices.length;
		// put texture data into buffer
		for (var j=0; j<d.texCoords.length; j++) {
			// start at vOffset
			texCoords[j + tOffset] = d.texCoords[j];
		}
		// create a data view in vertices starting at vOffset
		this[i].TBO = new DataView(texCoords.buffer, tOffset, d.texCoords.length);
		// advance offsets
		vOffset += d.vertices.length;
		iOffset += d.indices.length;
		tOffset += d.texCoords.length;
	});
	// create VBO
	this.VBO = GE.gl.createBuffer();
	GE.gl.bindBuffer(GE.gl.ARRAY_BUFFER, this.VBO);
	GE.gl.vertexAttribPointer(0, 3, GE.gl.FLOAT, false, 0, 0);
	GE.gl.bufferData(GE.gl.ARRAY_BUFFER, vertices, GE.gl.STATIC_DRAW);
	GE.gl.bindBuffer(GE.gl.ARRAY_BUFFER, null);

	// create buffer for texture coordinates
	if (tCount > 0) {
		this.TBO = GE.gl.createBuffer();
		GE.gl.bindBuffer(GE.gl.ARRAY_BUFFER, this.TBO);
		GE.gl.vertexAttribPointer(1, 2, GE.gl.FLOAT, false, 0, 0);
		GE.gl.bufferData(GE.gl.ARRAY_BUFFER, texCoords, GE.gl.STATIC_DRAW);
		GE.gl.bindBuffer(GE.gl.ARRAY_BUFFER, null);
	}
	
	// create IBO
	this.IBO = GE.gl.createBuffer();
	GE.gl.bindBuffer(GE.gl.ELEMENT_ARRAY_BUFFER, this.IBO);
	GE.gl.bufferData(GE.gl.ELEMENT_ARRAY_BUFFER, indices, GE.gl.STATIC_DRAW);
	GE.gl.bindBuffer(GE.gl.ELEMENT_ARRAY_BUFFER, null);

};

ModelGroup.prototype.render = function() {
	// set shaders
	GE.gl.useProgram(this.prg);
	// set textures
//    for (var i=0; i<this.textures.length; i++) {
//        GE.gl.activeTexture(GE.gl.TEXTURE0);
//        GE.gl.bindTexture(GE.gl.TEXTURE_2D, this.textures[i]);
//    }
	GE.gl.activeTexture(GE.gl.TEXTURE0);
	GE.gl.bindTexture(GE.gl.TEXTURE_2D, this.textures[0]);

	// enable vertex attributes
    for (var i=0; i<this.nAttributes; i++) {
    	GE.gl.enableVertexAttribArray(i);
    }
    // set VBO
    GE.gl.bindBuffer(GE.gl.ARRAY_BUFFER, this.VBO);
    // set TBO
//    if (this.TBO != null) {
//    	GE.gl.bindBuffer(GE.gl.ARRAY_BUFFER, this.TBO);
//    }
    // set IBO
    GE.gl.bindBuffer(GE.gl.ELEMENT_ARRAY_BUFFER, this.IBO);

    // render models
    for (var i=0; i<this.models.length; i++) {
    	this.models[i].render();
    }
    GE.gl.bindBuffer(GE.gl.ELEMENT_ARRAY_BUFFER, null);
    GE.gl.bindBuffer(GE.gl.ARRAY_BUFFER, null);
};

