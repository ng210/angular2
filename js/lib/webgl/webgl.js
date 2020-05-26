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

	    for (var type in shaders) {
            var shader = webGL.createShader(type, shaders[type]);
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
			var size = sizem[attrib.type] * attrib.size;
        	this.attributes[ak] = {
				'ref': ref,
				'type': attrib.type,
				'size': attrib.size,
				'offset': attrib.offset || this.size
			};
			this.size += size;
        }
        for (var uk in uniforms) {
			var uniform = uniforms[uk];
			uniform.ref = gl.getUniformLocation(this.prg, uk);
			uniform.update = uniform.ref ? webGL.uniformUpdaters[uniform.type] : () => {};
			this.uniforms[uk] = uniform;
		}
        
	}
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
		VERTEX_ATTRIB_TEXTURE2:  0x10
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
				gl.enableVertexAttribArray(a.ref);
				gl.vertexAttribPointer(a.ref, a.size, a.type, false, p.size, a.offset);
			}
		}
		if (uniforms) {
			p.setUniforms(uniforms);
		}
	};
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

	public(webGL, 'webGL');

})();