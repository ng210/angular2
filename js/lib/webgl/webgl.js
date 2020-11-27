(function () {
	// ********************************************************************************************
	//
	// Program
	//
	// ********************************************************************************************
	function Program(shaders, attributes, uniforms) {
    	this.prg = gl.createProgram();
		this.attributes = {};
		this.uniforms = {};
		this.shaders = [];

	    for (var type in shaders) {
			var shader = webGL.createShader(type, shaders[type]);
			this.shaders.push(shader);
            gl.attachShader(this.prg, shader);
        }
        gl.linkProgram(this.prg);

        if (!gl.getProgramParameter(this.prg, gl.LINK_STATUS)) {
            throw new Error('Error linking shader program: ' + gl.getProgramInfoLog(this.prg));
        }
		this.size = 0;
        for (var ak in attributes) {
            var ref = gl.getAttribLocation(this.prg, ak);
			var attrib = attributes[ak];
	        var sizem = {};
			sizem[gl.BYTE] = 1;
			sizem[gl.SHORT] = 2;
			sizem[gl.FLOAT] = 4;
			var sizeInBytes = sizem[attrib.type] * attrib.size;
			if (attrib.type == webGL.FLOAT4x4M) {
				sizeInBytes = 4*16;
				attrib.size = 4;
			}
			this.attributes[ak] = {
				'ref': ref,
				'type': attrib.type,
				'size': attrib.size,
				'sizeInBytes': sizeInBytes,
				'offset': attrib.offset != undefined ? attrib.offset : this.size,
				'indexed': attrib.indexed || false
			};
			this.size += sizeInBytes;
		}

        for (var uk in uniforms) {
			var uniform = uniforms[uk];
			uniform.ref = gl.getUniformLocation(this.prg, uk);
			uniform.update = uniform.ref ? webGL.uniformUpdaters[uniform.type] : () => {};
			this.uniforms[uk] = uniform;
		}
        
	}
	Program.prototype.destroy = function destroy() {
		for (var i=0; i<this.shaders.length; i++) {
			gl.deleteShader(this.shaders[i]);
		}
		gl.deleteProgram(this.prg);
	};
	Program.prototype.updateUniform = function(name) {
		var uniform = this.uniforms[name];
		if (uniform) {
			uniform.update(uniform);
		}
	};
    Program.prototype.setUniforms = function(uniforms) {
		if (uniforms) {
			for (var uk in uniforms) {
				var uniform = this.uniforms[uk];
				if (uniform !== undefined && uniform.ref) {
					uniform.value = uniforms[uk];
					uniform.update(uniform);
				}
			}
		} else {
			for (var uk in this.uniforms) {
				var uniform = this.uniforms[uk];
				uniform.update(uniform);
			}
		}
	};

	var webGL = {
		INT: 0x00,
		INTV: 0x10,
		FLOAT:  0x01,
		FLOATV: 0x20,
		FLOAT2V:  0x02,
		FLOAT3V:  0x03,
		FLOAT4V:  0x04,
		FLOAT2x2M:  0x05,
		FLOAT3x3M:  0x06,
		FLOAT4x4M:  0x07,
		VERTEX_ATTRIB_POSITION:  0x01,
		VERTEX_ATTRIB_NORMAL:  0x02,
		VERTEX_ATTRIB_COLOR:  0x04,
		VERTEX_ATTRIB_TEXTURE1:  0x08,
		VERTEX_ATTRIB_TEXTURE2:  0x10,

		extensions: {}
	};

	webGL.createShader = function(type, code) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, code);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error('Error compiling shader:' + gl.getShaderInfoLog(shader));
		}
		// var node = typeof sh === 'string' ? document.getElementById(sh) : sh;
		// if (node != null) {
		//     var code = node.childNodes[0].nodeValue;
		//     var type = {
		//         'x-shader/x-vertex': gl.VERTEX_SHADER,
		//         'x-shader/x-fragment': gl.FRAGMENT_SHADER
		//     }[node.getAttribute('type')];
		//     var shader = gl.createShader(type);
		//     gl.shaderSource(shader, code);
		//     gl.compileShader(shader);
		//     if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		//         throw new Error('Error compiling shader:' + gl.getShaderInfoLog(shader));
		//     }
		// } else {
		//     throw new Error('Shader id not found!');
		// }
		return shader;
	};
	webGL.createProgram = function(shaders, attributes, uniforms) {
		return new Program(shaders, attributes, uniforms);
	};
	webGL.useProgram = function(p, uniforms) {
		gl.useProgram(p.prg);
		for (var ai in p.attributes) {
			var a = p.attributes[ai];
			if (a.ref != -1) {
				var count = a.type == webGL.FLOAT4x4M ? 4 : 1;
				var offset = a.offset;
				for (var i=0; i<count; i++) {
					var ref = a.ref + i;
					gl.enableVertexAttribArray(a.ref);
					gl.vertexAttribPointer(a.ref, a.size, a.type, false, p.size, offset);
					if (a.indexed) webGL.extensions['ANGLE_instanced_arrays'].vertexAttribDivisorANGLE(ref, 1);
					offset += a.sizeInBytes;
				}
			}
		}
		if (uniforms) {
			p.setUniforms(uniforms);
		}
	};
	webGL.createTexture = function createTexture(image) {
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
		return texture;
	};

	webGL.useExtension = function useExtension(extensionName) {
		var ext = gl.getExtension(extensionName);
		if (ext) webGL.extensions[extensionName] = ext;
		return ext;
	}

	webGL.uniformUpdaters = (function() {
		var map = {};
		map[webGL.INT] = uniform => gl.uniform1i(uniform.ref, uniform.value);
		map[webGL.INTV] = uniform => gl.uniform1iv(uniform.ref, uniform.value);
		map[webGL.FLOAT] = uniform => gl.uniform1f(uniform.ref, uniform.value);
		map[webGL.FLOATV] = uniform => gl.uniform1fv(uniform.ref, uniform.value);
		map[webGL.FLOAT2V] = uniform => gl.uniform2fv(uniform.ref, uniform.value);
		map[webGL.FLOAT3V] = uniform => gl.uniform3fv(uniform.ref, uniform.value);
		map[webGL.FLOAT4V] = uniform => gl.uniform4fv(uniform.ref, uniform.value);
		map[webGL.FLOAT2x2M] = uniform => gl.uniformMatrix2fv(uniform.ref, false, uniform.value);
		map[webGL.FLOAT3x3M] = uniform => gl.uniformMatrix3fv(uniform.ref, false, uniform.value);
		map[webGL.FLOAT4x4M] = uniform => gl.uniformMatrix4fv(uniform.ref, false, uniform.value);
		return map;
	})();

	publish(webGL, 'webGL');

})();