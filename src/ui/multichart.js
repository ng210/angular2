include('/ui/control.js');
include('/webgl/webgl.js');

(function() {
    var _supportedEvents = ['click', 'mousemove', 'mouseover', 'mouseout', 'mousedown', 'mouseup'];
    Ui.MultiChart = function(id, template, parent, path) {
        template = template || {};
        template.type = template.type || 'multichart';
        template.events = [/*'click',*/ 'mousemove', 'mousedown', 'mouseup'];
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

        this.selectedChannelId = 0;

        this.program = null;
        this.uniforms = {
            uFrame: { type:webGL.FLOAT, value: 0 },
            uMaxX: { type:webGL.FLOAT, value: 0.0 },
            uSize: { type:webGL.FLOAT2V, value: new Float32Array(2) },
            uOffset: { type:webGL.FLOAT2V, value: new Float32Array([0.0, 0.0]) },
            uZoom: { type:webGL.FLOAT2V, value: new Float32Array([1.0, 1.0])},
            uUnit: { type:webGL.FLOAT2V, value: new Float32Array(template.unit) },
            uGridColor: { type:webGL.FLOAT3V, value: new Float32Array(template['grid-color']) },
            uMousePos: { type:webGL.FLOAT2V, value: new Float32Array([0.0, 0.0]) },
            uPointCount:  { type:webGL.INT, value: 0 },
            uDataPoints:  { type:webGL.FLOAT2V, value: new Float32Array(2) }
        }
        this.the2triangles = null;
        this.path = path || '/ui/multichart/shaders/default';
        this.editState = 0;
        this.dragStart = [0, 0];
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
    Ui.MultiChart.prototype.updateDataPoints = function(start, length) {
        if (this.dataSource) {
            var max = this.dataSource.getMax(this.selectedChannelId);
            start = start || Math.floor(this.uniforms.uOffset.value[0]/this.uniforms.uUnit.value[0]) - 1;
            length = length || Math.floor(this.uniforms.uSize.value[0]/this.uniforms.uUnit.value[0]) + 2;
            var end = start + length;
            if (start > max[0] || end < 0) return;
            var range = { start:start, end:start + length, step:1.0 };
            var points = this.dataSource.getRange(this.selectedChannelId, range);
            this.uniforms.uMaxX.value = max[0] + 1;
            this.program.updateUniform('uMaxX');
            if (range.count > 0) {
                this.uniforms.uPointCount.value = range.count;
                this.program.updateUniform('uPointCount');
console.log('upload ' + range.count + ' points');
                this.uniforms.uDataPoints.value = new Float32Array(points);
                this.program.updateUniform('uDataPoints');
            }
        }
    };
    Ui.MultiChart.prototype.registerHandler = function(event) {
        if (_supportedEvents.indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
        Ui.Control.registerHandler.call(this, event);
    };
    Ui.MultiChart.prototype.render = async function(node) {
        Ui.MultiChart.base.render.call(this, node);
        this.element.style.boxSizing = 'border-box';
        // create and initialize canvas for webgl rendering
        if (this.canvas === null) {
            this.canvas = document.createElement('canvas');
            this.template.width = this.template.width || this.canvas.width;
            this.template.height = this.template.height || this.canvas.height;
            this.canvas.width = this.template.width;
            this.canvas.height = this.template.height;
            this.canvas.id = this.id+'_canvas';
            this.element.appendChild(this.canvas);
            this.gl = await this.initializeWebGL();
            this.resize();
            this.updateDataPoints();
        }
        // create titlebar
        if (this.titleBar === null && this.template.titlebar) {
            this.titleBar = document.createElement('div');
            this.titleBar.id = this.id + '#title';
            this.titleBar.className = this.cssText + 'titlebar';
            this.titleBar.innerHTML = this.template.titlebar;
            this.titleBar.control = this;
            this.titleBar.style.boxSizing = 'border-box';
            this.titleBar.style.width = this.canvas.width + 'px';
            this.element.insertBefore(this.titleBar, this.element.childNodes[0]);
        }
        this.element.style.width = this.template.width + 'px';
        //this.element.style.height = this.template.height + 'px';
        this.isRunning = true;
        Ui.MultiChart.render(this);
    };
    Ui.MultiChart.prototype.initializeWebGL = async function() {
        const gl = this.canvas.getContext('webgl');
        // load shaders and build program
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
                this.uniforms
            );
        } else {
            // create default program
        }
        // create "canvas" of 2 triangles
        const positions = [-1.0,  1.0,  1.0,  1.0,  -1.0, -1.0,  1.0, -1.0];
        this.the2triangles = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.the2triangles);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.useProgram(this.program.prg);
        // set initial uniforms
        this.program.setUniforms();
        return gl;
    };
    Ui.MultiChart.prototype.paint = function() {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.uniforms.uFrame.value++;
        this.program.updateUniform('uFrame');
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    };
    Ui.MultiChart.prototype.resize = function(width, height) {
        if (width != undefined) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
        this.uniforms.uSize.value[0] = this.canvas.width;
        this.uniforms.uSize.value[1] = this.canvas.height;
        this.program.updateUniform('uSize');
    };

    Ui.MultiChart.prototype.draw = function(from, to, isComplete) {
        if (!this.dataSource.query(this.selectedChannelId, to[0], to[1])) {
            this.dataSource.set(this.selectedChannelId, to[0], to[1]);
        }
        if (isComplete) {
            console.log(from, to);
        }
    };
    Ui.MultiChart.prototype.erase = function(from, to, isComplete) {
        var indices = this.dataSource.findIndex(this.selectedChannelId, item => item.x == to[0] && item.y == to[1]);
        if (indices.length == 1) this.dataSource.removeAt(this.selectedChannelId, indices[0]);
    };
    Ui.MultiChart.prototype.edit = function(pos, isComplete) {
        var from = this.pointToData(this.dragStart);
        var to = this.pointToData(pos);
        switch (this.editState) {
            case 1: // edit
                this.draw(from, to, isComplete);
                this.updateDataPoints();
                this.paint();
                break;
            case 4: // remove
                this.erase(from, to, isComplete);
                this.updateDataPoints();
                this.paint();
                break;
        }
    };


    Ui.MultiChart.prototype.onmousemove = function(ctrl, e) {
        var pos = [e.layerX, ctrl.canvas.height - e.layerY];
        switch (this.editState) {
            case 2: // scroll/drag
                var deltaX = this.dragStart[0] - pos[0];
                var deltaY = this.dragStart[1] - pos[1];
                this.dragStart[0] = pos[0];
                this.dragStart[1] = pos[1];
                this.scroll(deltaX, deltaY);
                // if (this.uniforms.uOffset[0] == this.uniforms.uUnit[0]) {
                this.updateDataPoints();
                this.paint();
                // }
                break;
            case 3: // select
                break;
            default: // edit
                this.edit(pos);
                break;
        }
        if (this.gl) {
            this.gl.uniform2fv(this.program.uniforms.uMousePos.ref, pos);
        }
    };
    Ui.MultiChart.prototype.onmousedown = function(ctrl, e) {
        var pos = [e.layerX, ctrl.canvas.height - e.layerY];
        this.dragStart[0] = pos[0];
        this.dragStart[1] = pos[1];
        //if (e.altKey) this.editState = 1; // 
        if (e.ctrlKey) this.editState = 2; // scroll/drag
        else if (e.shiftKey) this.editState = 3; // select
        else {
            var dataPoint = this.pointToData(pos);
            this.editState = this.dataSource.query(this.selectedChannelId, dataPoint[0], dataPoint[1]) ? 4 : 1; // erase : draw
        }
        console.log(this.editState);
        return false;
    };
    Ui.MultiChart.prototype.onmouseup = function(ctrl, e) {
        var pos = [e.layerX, ctrl.canvas.height - e.layerY];
        this.edit(pos, true);
        this.editState = 0;
        var onclick = this.handlers['onclick'];
        if (onclick) {
            onclick.fn.call(onclick.obj, ctrl, e);
        }
    };

    Ui.MultiChart.prototype.scroll = function(scrollX, scrollY) {
        var offsetX = this.uniforms.uOffset.value[0] + scrollX;
        var offsetY = this.uniforms.uOffset.value[1] + scrollY;
        if (offsetX < 0) offsetX = 0;
        if (offsetY < 0) offsetY = 0;
        this.uniforms.uOffset.value[0] = offsetX;
        this.uniforms.uOffset.value[1] = offsetY;
        this.program.updateUniform('uOffset');
        this.updateDataPoints();
    };

    Ui.MultiChart.prototype.pointToData = function(point) {
        // apply offset and zoom
        var frame = Math.floor((point[0] + this.uniforms.uOffset.value[0]) / this.uniforms.uUnit.value[0]);
        var value = Math.floor((point[1] + this.uniforms.uOffset.value[1]) / this.uniforms.uUnit.value[1]);
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
