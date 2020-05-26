include('webgl/webgl.js');
include('math/v3.js');
include('math/m44.js');

(function() {

    const POSITION_X    = 0;
    const POSITION_Y    = 1 + POSITION_X;
    const POSITION_Z    = 1 + POSITION_Y;
    const TEXCOOR_U     = 1 + POSITION_Z;
    const TEXCOOR_V     = 1 + TEXCOOR_U;
    const COLOR_R       = 1 + TEXCOOR_V;
    const COLOR_G       = 1 + COLOR_R;
    const COLOR_B       = 1 + COLOR_G;
    const VERTEXSIZE    = 1 + COLOR_B;

    /**************************************************************************
     * Sprites have
     * - position(x, y, z) 
     * - frame
     * - color
     * - scale(x, y)
     * - rotation(x, y, z)
     *************************************************************************/
    function Sprite() {
        this.ix = 0;
        this.parent = null;
        this.dirty = 0xff;
        this.offset = 0;
        
        this.frameMap = null;
        this.frame = 0;

        this.position = new V3(0);
        this.scale = new V3(1);
        this.rotate = new V3(0);

        this.matrix = M44.identity();
    }
    // Sprite.prototype = {
    //     get x() { return SpriteManager.quads.readFloat32() },
    //     set x(v) { SpriteManager.buffer[this.ix][0] = v; },
    //     get y() { return SpriteManager.buffer[this.ix][1] },
    //     set y(v) { SpriteManager.buffer[this.ix][1] = v; },
    //     constructor: Sprite
    // };

    Sprite.prototype.setFrame = function setFrame(frameMapId, frameId) {
        var frameMap = this.parent.frameMaps[frameMapId];
        if (frameMap && frameMap.map[frameId]) {
            this.frameMap = frameMap;
            this.frame = frameMap.map[frameId];
            this.dirty |= 1;
        }
    }

    Sprite.prototype.update = function update() {
        if ((this.dirty & 1) != 0) {
            // frame changed => update quad
            var b = this.parent.vertices;
            var o = this.offset;
            var f = this.frame;
            // #1 - top left
            b[o + POSITION_X] = 0; b[o + POSITION_Y] = 0; b[o + POSITION_Z] = this.position.z;
            b[o + TEXCOOR_U] = f[0]; b[o + TEXCOOR_V] = f[3];
            o += VERTEXSIZE;
            // #2 - top right
            b[o + POSITION_X] = f[2]; b[o + POSITION_Y] = 0; b[o + POSITION_Z] = this.position.z;
            b[o + TEXCOOR_U] = f[0]+f[2]; b[o + TEXCOOR_V] = f[1];
            o += VERTEXSIZE;
            // #3 - bottom left
            b[o + POSITION_X] = 0; b[o + POSITION_Y] = f[3]; b[o + POSITION_Z] = this.position.z;
            b[o + TEXCOOR_U] = f[0]; b[o + TEXCOOR_V] = f[1]+f[3];
            o += VERTEXSIZE;
            // #4 - bottom right
            b[o + POSITION_X] = f[2]; b[o + POSITION_Y] = f[3]; b[o + POSITION_Z] = this.position.z;
            b[o + TEXCOOR_U] = f[0]+f[2]; b[o + TEXCOOR_V] = f[1]+f[3];
            this.parent.dirty = true;
            this.dirty &= ~1;
        }
        if ((this.dirty & 2) != 0) {
            // position, rotation, scale changed => update matrix
            this.matrix = M44.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400).mul(M44.translate(this.position)).mul(M44.rotateZ(this.rotate.z)).mul(M44.scale(this.scale));
            this.dirty &= ~2;
        }
    };

    Sprite.prototype.render = function render(f) {
        // set uniform
        // draw quad
    };

    function SpriteManager() {
        this.count = 0;
        this.vertices = new Float32Array(10*4*VERTEXSIZE);     // allocate space for 100 sprites
        this.indices = new Uint16Array(10*4);                  // allocate space for 100 sprites
        this.frameMaps = [];
        this.vbo = null;
        this.ibo = null;
        this.dirty = 0;
        this.sprites = [];
    }

    SpriteManager.prototype.initialize = async function initialize(mapUrl) {
        // load resources
        var resources = await load([
            { url: mapUrl, responseType: 'json' },
            { url: 'webgl/sprite/sprite.vs', contentType: 'x-shader/x-vertex', shaderType: gl.VERTEX_SHADER },
            { url: 'webgl/sprite/sprite.fs', contentType: 'x-shader/x-fragment', shaderType: gl.FRAGMENT_SHADER }
        ]);
        if (resources[0].error) throw new Error(`Could not load '${resources[0].url}'!`);
        if (resources[1].error) throw new Error(`Could not load '${resources[1].url}'!`);
        if (resources[2].error) throw new Error(`Could not load '${resources[2].url}'!`);
        // set map and load image
        var map = resources[0].data.map;
        var image = await load(resources[0].data.image);
        // create texture
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image.node);
        gl.generateMipmap(gl.TEXTURE_2D);
        this.frameMaps.push({map: map, texture: texture});
        // create shaders and  program
        var shaders = {};
        shaders[gl.VERTEX_SHADER] = resources[1].data;
        shaders[gl.FRAGMENT_SHADER] = resources[2].data;
        this.program = webGL.createProgram(shaders, {
            a_position: { type:gl.FLOAT, size:3 },
            a_texcoord: { type:gl.FLOAT, size:2 }
        }, {
            u_texture: { type:webGL.INT, value: 0 },
            u_matrix: { type:webGL.FLOAT4x4M, value: M44.identity().data }
        });

        // create buffers
        this.vbo = gl.createBuffer();
        this.ibo = gl.createBuffer();
    };

    SpriteManager.prototype.add = function add(frameMapId, frameId) {
        var spr = new Sprite();
        var ix = this.count++;
        spr.parent = this;
        spr.offset = spr.ix * 4*4*VERTEXSIZE;
        this.indices[4*ix  ] = 4*ix;
        this.indices[4*ix+1] = 4*ix+1;
        this.indices[4*ix+2] = 4*ix+2;
        this.indices[4*ix+3] = 4*ix+3;
        spr.ix = ix;
        spr.setFrame(frameMapId, frameId);
        spr.update();
        this.sprites.push(spr);
        return spr;
    };

    SpriteManager.prototype.update = function update() {
        if (this.dirty) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
            // this.vertices[0] = -1.0;
            // this.vertices[1] = 1.0;
            // this.vertices[2] = 1.0;

            // this.vertices[5] = 1.0;
            // this.vertices[6] = 1.0;
            // this.vertices[7] = 1.0;

            // this.vertices[10] = -1.0;
            // this.vertices[11] = -1.0;
            // this.vertices[12] = 1.0;

            // this.vertices[15] = 1.0;
            // this.vertices[16] = -1.0;
            // this.vertices[17] = 1.0;
            gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
            gl.bufferData(gl.ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
            this.dirty = false;
        }
    };

    SpriteManager.prototype.render = function render(frame) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
        //this.program.uniforms.u_matrix.value = spr.matrix.data;
debugger
        webGL.useProgram(this.program, null);
        for (var i=0; i<this.count; i++) {
            var spr = this.sprites[i];
            gl.uniform1i(this.program.uniforms.u_texture.ref, 0);
            gl.uniformMatrix4fv(this.program.uniforms.u_matrix.ref, false, spr.matrix.data);
            gl.drawArrays(gl.TRIANGLE, 0, 3);
            //gl.drawElements(gl.TRIANGLE, 1, gl.UNSIGNED_SHORT, 4*spr.ix);
        }
        // gl.bindBuffer(gl.ARRAY_BUFFER, null);
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    };

    public(Sprite, 'Sprite', webGL);
    public(SpriteManager, 'SpriteManager', webGL);
})();