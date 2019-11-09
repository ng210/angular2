include('/ui/control.js');
include('/webgl/webgl.js');

(function() {
    Ui.MultiChart = function(id, template, parent, path) {
        template = template || {};
        template.type = template.type || 'multichart';
        template.events = ['click', 'mousemove'];
        template['unit'] = template['unit'] || [10, 10];
        template['grid-color'] = template['grid-color'] || [0.1, 0.2, 0.5];
        Ui.Control.call(this, id, template, parent);
        // template
        // - titlebar (bool|text): titlebar
        // - grid: bool
        // - stepX, stepY: number
        this.template = template || { grid: true, titlebar: id, type:'multichart' };
        this.titleBar = null;
        this.canvas = null;
        this.gl = null;

        this.program = null;
        this.config = {
            uSize: [300.0, 240.0],
            uOffset: [0.0, 0.0],
            uZoom: [1.0, 1.0],
            uUnit: template.unit,
            uGridColor: template['grid-color']
        };

        this.uniforms = null;
        this.the2triangles = null;
        this.path = path;
        this.frame = 0;
        this.timer = null;
        this.isRunning = false;
    }
    Ui.MultiChart.base = Ui.Control.prototype;
    Ui.MultiChart.prototype = new Ui.Control();
    Ui.Control.Types['multichart'] = { ctor: Ui.MultiChart, tag: 'DIV' };

	Ui.Control.prototype.dataBind = function(obj, field) {
		this.dataSource = obj;
		this.dataField = field !== undefined ? field : this.dataField;
		return this.dataSource;
	};
	Ui.MultiChart.prototype.registerHandler = function(event) {
        if (['click', 'mousemove', 'mouseover', 'mouseout'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
        Ui.Control.registerHandler.call(this, event);
    };
    Ui.MultiChart.prototype.render = async function(node) {
        Ui.MultiChart.base.render.call(this, node);
        // create titlebar
        if (this.titleBar === null && this.template.titlebar) {
            this.titleBar = document.createElement('div');
            this.titleBar.id = this.id + '#title';
            this.titleBar.className = this.cssText + 'titlebar';
            this.titleBar.innerHTML = this.template.titlebar;
            this.titleBar.control = this;
            this.element.insertBefore(this.titleBar, this.element.childNodes[0]);
        }
        // create and initialize canvas for webgl rendering
        if (this.canvas === null) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = this.id+'_canvas';
            if (this.template.width) this.canvas.width = this.template.width;
            if (this.template.height) this.canvas.height = this.template.height;
            this.element.appendChild(this.canvas);
            const gl = this.canvas.getContext('webgl');
            if (this.path != null) {
                var files = [
                    { url: `${this.path}.vs`, contentType: 'x-shader/x-vertex' },
                    { url: `${this.path}.fs`, contentType: 'x-shader/x-fragment' }
                ];
                var resources = await load(files);
                if (resources.findIndex(x => x.error instanceof Error) != -1) {
                    throw new Error('Could not initialize shaders!');
                }
                var shaders = {};
                shaders[gl.VERTEX_SHADER] =  resources[0].data;
                shaders[gl.FRAGMENT_SHADER] =  resources[1].data;
                this.program = webGL.createProgram(gl, shaders,
                    { position:{type:gl.FLOAT, size:4} },
                    {
                        uFrame: {type:webGL.FLOAT },
                        uSize: {type:webGL.FLOAT2V },
                        uOffset: {type:webGL.FLOAT2V },
                        uZoom: {type:webGL.FLOAT2V },
                        uUnit: {type:webGL.FLOAT2V },
                        uGridColor: {type:webGL.FLOAT3V },
                        uMousePos: {type:webGL.FLOAT2V }
                    }
                );
            } else {
                // create default program
            }
            const positions = [-1.0,  1.0,  1.0,  1.0,  -1.0, -1.0,  1.0, -1.0];
            this.the2triangles = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.the2triangles);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.the2triangles);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            // this.uniforms.frame = gl.getUniformLocation(this.program.prg, 'uFrame');
            // this.uniforms.size = gl.getUniformLocation(this.program.prg, 'uSize');
            // this.uniforms.size = gl.getUniformLocation(this.program.prg, 'uSize');

            gl.useProgram(this.program.prg);
            this.config.uSize[0] = this.canvas.width;
            this.config.uSize[1] = this.canvas.height;
            this.program.setUniforms(gl, this.config);
    
            this.gl = gl;
        }
        this.isRunning = true;
        Ui.MultiChart.render(this);
    };
    Ui.MultiChart.prototype.paint = function() {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
        // set uniforms
        this.gl.uniform1f(this.program.uniforms.frame, this.frame++);
        //this.gl.uniform2f(this.uniforms.size, this.canvas.width, this.canvas.height);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        // this.gl.disableVertexAttribArray(0);
        // this.gl.useProgram(0);
    };
    Ui.MultiChart.prototype.onmousemove = function(ctrl, e) {
        var pos = [e.layerX, e.layerY];
        if (this.gl) {
            this.gl.uniform2fv(this.program.uniforms.uMousePos.ref, pos);
        }
    };

    Ui.MultiChart.prototype.onclick = function(ctrl, e) {
        var pos = [e.layerX, e.layerY];
        var ix = ctrl.pointToData(pos);
        for (var i=0; i<ix[0]; i++) {
            if (this.dataSource.get(i, 0) == undefined) {
                this.dataSource.set(i, 0, NaN);
            }
        }
        this.dataSource.set(ix[0], 0, ix[1]);
        console.log(this.dataSource.data);
    };

    Ui.MultiChart.prototype.pointToData = function(point) {
        // apply offset and zoom
        var frame = Math.floor(point[0] / this.config.uUnit[0]);
        var value = Math.floor(point[1] / this.config.uUnit[1]);
        return [frame, value];
    };

    Ui.MultiChart.render = function(instance) {
        clearTimeout(instance.timer);
        if (instance.isRunning) {
            instance.paint();
            instance.timer = setTimeout(Ui.MultiChart.render, 60, instance);
        }
    };

})();