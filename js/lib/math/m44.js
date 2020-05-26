(function() {
    include('v4.js');

    function M44(data, isColumnMajor) {
        if (data != undefined) {
            if (data instanceof M44) {
                this.set(data);
            } else if (data.constructor == Float32Array || data.constructor == Float64Array || Array.isArray(data)) {
                // m23: element of row #2 and column #3
                var k = 0;
                for (var j=0; j<4; j++) {
                    for (var i=0; i<4; i++) {
                        var ix = !isColumnMajor ? 4*j+i : 4*i+j;
                        this[ix] = data[k++];
                    }
                }
            } else if (typeof data == 'number') {
                for (var i=0; i<16; i++) this[i] = data;
            } else {
                throw new Error('Could not create M44 from these arguments!');
            }
        }
    }
    M44.prototype = new Float32Array(16);

    M44.prototype.mul = function(m44, r44) {
        r44 = r44 || new M44();
        for (var aj=0; aj<4; aj++) {
            for (var bi=0; bi<4; bi++) {
                r44[4*aj+bi] = 0;
                for (var k=0; k<4; k++) {
                    r44[4*aj+bi] += this[4*k+bi] * m44[4*aj+k];
                }
            }
        }
        return r44;
    }

    M44.prototype.mulV = function(v4, r4) {
        var k = 0;
        r4 = r4 || new V4();
        for (var i=0; i<4; i++) {
            for (var j=0; j<4; j++) {
                r4[i] += this[k++] * v4[j];
            }
        }
        return r4;
    };

    M44.prototype.set = function(m44) {
        for (var i=0; i<16; i++) {
            this[i] = m44[i];
        }
        return this;
    };

    M44.identity = function(r44) {
        // 1, 0, 0, 0
        // 0, 1, 0, 0
        // 0, 0, 1, 0
        // 0, 0, 0, 1
        r44 = r44 || new M44(0);
        for (var i=0; i<16; i++) {
            r44[i] = 0;
        }
        r44[0] = 1;
        r44[5] = 1;
        r44[10] = 1;
        r44[15] = 1;
        return r44;
    };

    M44.translate = function(t, r44) {
        //  1,  0,  0,  0
        //  0,  1,  0,  0
        //  0,  0,  1,  0
        // tx, ty, tz,  1
        r44 = M44.identity(r44);
        r44[12] = t[0];
        r44[13] = t[1];
        r44[14] = t[2];
        return r44;
    };
     
    M44.rotateX = function(rad, r44) {
        // 1,  0,  0,  0,
        // 0,  c,  s,  0,
        // 0, -s,  c,  0,
        // 0,  0,  0,  1
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        r44 = M44.identity(r44);
        r44[5] = c;
        r44[6] = s;
        r44[9] = -s;
        r44[10] = c;
        return r44;
    };
     
    M44.rotateY = function(rad, r44) {
        // c,  0, -s,  0,
        // 0,  1,  0,  0,
        // s,  0,  c,  0,
        // 0,  0,  0,  1
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        r44 = M44.identity(r44);
        r44[0] = c;
        r44[2] = -s;
        r44[8] = s;
        r44[10] = c;
        return r44;
    };
     
    M44.rotateZ = function(rad, r44) {
        //  c,  s,  0,  0,
        // -s,  c,  0,  0,
        //  0,  0,  1,  0,
        //  0,  0,  0,  1
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        r44 = M44.identity(r44);
        r44[0] = c;
        r44[1] = s;
        r44[4] = -s;
        r44[5] = c;
        return r44;
    };
     
    M44.scale = function(s, r44) {
        // sx,  0,  0,  0,
        //  0, sy,  0,  0,
        //  0,  0, sz,  0,
        //  0,  0,  0,  1
        r44 = M44.identity(r44);
        r44[0] = s[0];
        r44[5] = s[1];
        r44[9] = s[2];
        return r44;
    };

    M44.projection = function(width, height, depth, r44) {
        // 2/w,   0,   0,   0,
        //   0,-2/h,   0,   0,
        //   0,   0, 2/d,   0,
        //  -1,   1,   0,   1
        r44 = M44.identity(r44);
        r44[0] = 2/width;
        r44[5] = -2/height;
        r44[10] = 2/depth;
        r44[12] = -1; r44[13] = 1;
        return r44;
    };

    M44.perspective = function(fov, aspect, near, far, r44) {
        r44 = M44.identity(r44);
        var f = Math.tan(0.5 * (Math.PI - fov));
        var d = near - far;
        r44[0] = f / aspect;
        r44[5] = f;
        r44[10] = (near + far) / d; r44[11] = -1;
        r44[14] = 2 * near * far / d; r44[15] = 0;
    };

    public(M44, 'M44');

})();