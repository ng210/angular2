(function () {
	function GlProgram(gl, shaders, attributes, uniforms) {
    	this.prg = gl.createProgram();
		this.attributes = {};
		this.uniforms = {};

	    for (var type in shaders) {
            var shader = webGL.createShader(gl, type, shaders[type]);
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
			var size = sizem[attrib.type]*attrib.size;
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
	        this.uniforms[uk] = {
				'ref': gl.getUniformLocation(this.prg, uk),
				'type': uniform.type
			};
        }
        this.constructor = GlProgram;
    }
    GlProgram.prototype.setUniforms = function(gl, uniforms) {
		if (!uniforms) return;
		//Dbg.prln('setUniforms');
		for (var ui in uniforms) {
			var uniform = this.uniforms[ui];
			if (uniform !== undefined && uniform.ref) {
				var v = uniforms[ui];
			//Dbg.prln(ui+':'+v);
				switch (uniform.type) {
					case webGL.FLOAT: gl.uniform1f(uniform.ref, v); break;
					case webGL.FLOAT2V: gl.uniform2fv(uniform.ref, v); break;
					case webGL.FLOAT3V: gl.uniform3fv(uniform.ref, v); break;
					case webGL.FLOAT4V: gl.uniform4fv(uniform.ref, v); break;
					case webGL.FLOAT2x2M: gl.uniformMatrix2fv(uniform.ref, false, v); break;
					case webGL.FLOAT3x3M: gl.uniformMatrix3fv(uniform.ref, false, v); break;
					case webGL.FLOAT4x4M: gl.uniformMatrix4fv(uniform.ref, false, v); break;
				}
			}
		}
	};

	var webGL = {
		createShader: function(gl, type, code) {
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
	    },
		createProgram: function(gl, shaders, attributes, uniforms) {
	        return new GlProgram(gl, shaders, attributes, uniforms);
	    },
		useProgram: function(gl, p, uniforms) {
			gl.useProgram(p.prg);
			for (var ai in p.attributes) {
				var a = p.attributes[ai];
				if (a.ref != -1) {
					gl.enableVertexAttribArray(a.ref);
					gl.vertexAttribPointer(a.ref, a.size, a.type, false, p.size, a.offset);
				}
			}
			p.setUniforms(uniforms);
		},
    };
	webGL.FLOAT        = 0x01;
    webGL.FLOAT2V      = 0x02;
    webGL.FLOAT3V      = 0x03;
    webGL.FLOAT4V      = 0x04;
	webGL.FLOAT2x2M    = 0x05;
    webGL.FLOAT3x3M    = 0x06;
    webGL.FLOAT4x4M    = 0x07;
	webGL.VERTEX_ATTRIB_POSITION = 0x01;
    webGL.VERTEX_ATTRIB_NORMAL   = 0x02;
    webGL.VERTEX_ATTRIB_COLOR    = 0x04;
    webGL.VERTEX_ATTRIB_TEXTURE1 = 0x08;
    webGL.VERTEX_ATTRIB_TEXTURE2 = 0x10;

	public(webGL, 'webGL');

})();