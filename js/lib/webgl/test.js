(function() {
    include('math/v2.js');
    include('math/m44.js');
    include('webgl/webgl.js');

    var _vbo = null;
    var _ibo = null;

    var _timer = null;
    var _update = null;
    var _render = null;
    var _lastTick = 0;

    var _instances = [];

    function Instance() {
        this.position = new V2(Math.random(), Math.random());
        this.velocity = new V2(Math.random(), Math.random()).sub(new V2(0.5)).scale(0.6).add(new V2(0.2));
        this.rotation = Math.random();
        this.scale = new Float32Array([0.5+Math.random(), 0.5+Math.random(), 0]);
        this.color = new Float32Array([Math.random(), Math.random(), Math.random(), 1.0]);
        this.matrix = new Float32Array(16);
    }

    Instance.prototype.adjustPosition = function() {
        if (this.position.x < 0) {this.position.x = -this.position.x; this.velocity.x = -this.velocity.x; }
        else if (this.position.x > 1) {this.position.x = 2 - this.position.x; this.velocity.x = -this.velocity.x; }
        if (this.position.y < 0) { this.position.y = -this.position.y; this.velocity.y = -this.velocity.y; }
        else if (this.position.y > 1) { this.position.y = 2 - this.position.y; this.velocity.y = -this.velocity.y; }
    }

    function setGeometry() {
        var vertices = new Float32Array([0, 0, 0,  10, 0, 0,  0, 10, 0,  10, 10, 0]);
        _vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, _vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        var indices = new Uint16Array([0, 1, 2,  2, 1, 3]);
        _ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }

    function animate() {
        clearTimeout(_timer);

        var t = new Date().getTime();
        var dt = 0.0005*(t - _lastTick);
        _update(dt);
        _render(dt);
        _lastTick = t;
        
        _timer = setTimeout(animate, 100);
    }

    function start(update, render, shader) {
        _update = update;
        _render = dt => {
            gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
            gl.clearColor(0.02, 0.1, 0.2, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            webGL.useProgram(shader);
            render(dt);
        };
        _lastTick = new Date().getTime();
        animate();
    }

    function setup(count) {
        var canvas = document.createElement('canvas');
        canvas.id = 'canvas';
        canvas.width = 640; canvas.height = 480;
        document.body.appendChild(canvas);
        window.gl = canvas.getContext('webgl');
        _size = new V2(canvas.clientWidth, canvas.clientHeight);
        setGeometry();
        for (var i=0; i<count; i++) {
            _instances.push(new Instance());
        }

    }

    function test_simple_rendering() {
        const count = 40;
        setup(count);

        // create program
        var shaders = {};
        shaders[gl.VERTEX_SHADER] = 'attribute vec4 a_position; uniform vec4 u_color; uniform mat4 u_matrix; varying vec4 v_color; void main() { gl_Position = u_matrix*a_position; v_color = u_color; }';
        shaders[gl.FRAGMENT_SHADER] = 'precision mediump float; varying vec4 v_color; void main() { gl_FragColor = v_color;}';
        var shader = webGL.createProgram(shaders, {
            a_position: { type:gl.FLOAT, size:3 }
        }, {
            u_matrix: { type: webGL.FLOAT4x4M },
            u_color: { type: webGL.FLOAT4V }
        });

        start(
            dt => {
                for (var i=0; i<count; i++) {
                    var instance = _instances[i];
                    instance.position.add(instance.velocity.prodC(dt));
                    instance.adjustPosition();
                    instance.rotation += 40*instance.velocity.x*dt;
                    instance.scale.x = 1.5 + Math.cos(instance.velocity.x);
                    instance.scale.y = 1.5 + Math.sin(instance.velocity.y);
                    var matrix = M44.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);
                    var pos = new V4(instance.position.prod(_size));    //.diff([instance.scale.x*5, instance.scale.y*5]);
                    var center = new V4([-5, -5, 0, 0]);
                    //matrix.mul(M44.translate(pos)).mul(M44.rotateZ(instance.rotation)).mul(M44.scale(instance.scale), instance.matrix);
                    matrix.mul(M44.translate(pos)).mul(M44.rotateZ(instance.rotation)).mul(M44.scale(instance.scale)).mul(M44.translate(center), instance.matrix);
                }
            },
            dt => {
                for (var i=0; i<count; i++) {
                    var instance = _instances[i];
                    shader.uniforms.u_color.value = instance.color;
                    shader.updateUniform('u_color');
                    shader.uniforms.u_matrix.value = instance.matrix;
                    shader.updateUniform('u_matrix');
                    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
                }
            },
            shader
        );
    }

    function test_instanced_rendering() {
        const count = 10;
        setup(count);

        // create program
        var shaders = {};
        shaders[gl.VERTEX_SHADER] = 'attribute vec4 a_position; attribute vec4 a_color; attribute mat4 a_matrix; varying vec4 v_color; void main() { gl_Position = a_matrix*a_position; v_color = a_color; }';
        shaders[gl.FRAGMENT_SHADER] = 'precision mediump float; varying vec4 v_color; void main() { gl_FragColor = v_color;}';
        var shader = webGL.createProgram(shaders, {
            a_position: { type:gl.FLOAT, size:3 },
            a_matrix: { type:gl.FLOAT, size:4 },
            a_color: { type:gl.FLOAT, size:3 }
        }, null);
        const matrices = new Float32Array(count * 16);
        start(
            dt => {
                for (var i=0; i<count; i++) {
                    var instance = _instances[i];
                    instance.position.add(instance.velocity.prodC(dt));
                    instance.adjustPosition();
                    instance.rotation += 10*instance.velocity.x*dt;
                    instance.scale.x = 1.5 + Math.cos(instance.velocity.x);
                    instance.scale.y = 1.5 + Math.sin(instance.velocity.y);
                    var matrix = M44.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);
                    var pos = new V4(instance.position.prod(_size));
                    matrix.mul(M44.translate(pos)).mul(M44.rotateZ(instance.rotation)).mul(M44.scale(new V4(instance.scale)));
                }
            },
            dt => {
                for (var i=0; i<count; i++) {
                    var instance = _instances[i];
                    shader.uniforms.u_color.value = instance.color.data;
                    shader.updateUniform('u_color');
                    shader.uniforms.u_matrix.value = instance.matrix.data;
                    shader.updateUniform('u_matrix');
                    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
                }
            },
            shader
        );
    }

    var tests = () => [test_simple_rendering];

    public(tests, 'WebGL tests');

})();