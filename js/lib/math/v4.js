(function() {

    function V4(x, y, z, w) {
        if (x === undefined || typeof x === 'number') {
            if (arguments.length < 2) y = x, z = x, w = x;
            this[0] = x || .0;
            this[1] = y || .0;
            this[2] = z || .0;
            this[3] = w || .0;
        } else if (Array.isArray(x)) {
            this[0] = x[0] || .0;
            this[1] = x[1] || .0;
            this[2] = x[2] || .0;
            this[3] = x[3] || .0;
        } else if (x instanceof Float32Array) {
            this[0] = x[0];
            this[1] = x[1];
            this[2] = x[2] || 0;
            this[3] = x[3] || 0;
        } else {
            throw new Error('Could not create V4 from these arguments!');
        }
    }
    V4.prototype = new Float32Array(4);
    Object.defineProperties(V4.prototype,
        {
            x: { get: function() { return this[0]; }, set: function(x) { this[0] = x; } },
            y: { get: function() { return this[1]; }, set: function(y) { this[1] = y; } },
            z: { get: function() { return this[2]; }, set: function(z) { this[2] = z; } },
            w: { get: function() { return this[3]; }, set: function(w) { this[3] = w; } },
            len: { get: function() { return Math.sqrt(this.len2); } },
            len2: { get: function() { return this[0]*this[0] + this[1]*this[1] + this[2]*this[2] + this[3]*this[3]; } }
        }
    );

    // return this += v
    V4.prototype.add = function (v) {
        this[0] += v[0];
        this[1] += v[1];
        this[2] += v[2];
        this[3] += v[3];
        return this;
    };
    // return u = this - v
    V4.prototype.diff = function (v, r) {
        r = r || new V4(this);
        r[0] = this[0] - v[0];
        r[1] = this[1] - v[1];
        r[2] = this[2] - v[2];
        r[3] = this[3] - v[3];
        return r;
    };
    // return this · v
    V4.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    };
    // return this*v
    V4.prototype.mul = function (v) {
        this[0] *= v[0];
        this[1] *= v[1];
        this[2] *= v[2];
        this[3] *= v[3];
        return this;
    };
    // return normalize(this)
    V4.prototype.norm = function () {
        var len = this.len;
        this[0] /= len;
        this[1] /= len;
        this[2] /= len;
        this[3] /= len;
        return this;
    };
    // return u = (this.x*v.x, this.y*v.y, this.z*v.z)
    V4.prototype.prod = function (v, r) {
        r = r || new V4(0);
        r[0] = this[0] * v[0];
        r[1] = this[1] * v[1];
        r[2] = this[2] * v[2];
        r[3] = this[3] * v[3];
        return r;
    };
    // return u = this*c
    V4.prototype.prodC = function (c, r) {
        r = r || new V4(0);
        r[0] = this[0] * c;
        r[1] = this[1] * c;
        r[2] = this[2] * c;
        r[3] = this[3] * c;
        return r;
    };
    // return this*c;
    V4.prototype.scale = function (c) {
        this[0] *= c;
        this[1] *= c;
        this[2] *= c;
        this[3] *= c;
        return this;
    };
    // return this = (v.x, v.y, v.z)
    V4.prototype.set = function (v) {
        this[0] = v[0];
        this[1] = v[1];
        this[2] = v[2] || 0;
        this[3] = v[3] || 1;
        return this;
    };
    // return this -= v
    V4.prototype.sub = function (v) {
        this[0] -= v[0];
        this[1] -= v[1];
        this[2] -= v[2];
        this[3] -= v[3];
        return this;
    };
    // return u = this + v
    V4.prototype.sum = function (v, r) {
        r = r || new V4(0);
        r[0] = this[0] + v[0];
        r[1] = this[1] + v[1];
        r[2] = this[2] + v[2];
        r[3] = this[3] + v[3];
        return r;
    };

    // return "({this.x},{this.y},{this.z})"
    V4.prototype.toString = function () {
        return `(${this[0]},${this[1]},${this[2]},${this[3]})`;
    };

    public(V4, 'V4');
})();