(function() {

    function V3(x, y, z, w) {
        if (x === undefined || typeof x === 'number') {
            if (arguments.length < 2) y = x, z = x, w = x;
            this[0] = x || .0;
            this[1] = y || .0;
            this[2] = z || .0;
        } else if (Array.isArray(x)) {
            this[0] = x[0] || .0;
            this[1] = x[1] || .0;
            this[2] = x[2] || .0;
        } else if (x instanceof Float32Array) {
            this[0] = x[0];
            this[1] = x[1];
            this[2] = x[2] || 0;
        } else {
            throw new Error('Could not create V3 from these arguments!');
        }
    }
    V3.prototype = new Float32Array(3);
    Object.defineProperties(V3.prototype,
        {
            x: { get: function() { return this[0]; }, set: function(x) { this[0] = x; } },
            y: { get: function() { return this[1]; }, set: function(y) { this[1] = y; } },
            z: { get: function() { return this[2]; }, set: function(z) { this[2] = z; } },
            len: { get: function() { return Math.sqrt(this.len2); } },
            len2: { get: function() { return this[0]*this[0] + this[1]*this[1] + this[2]*this[2]; } }
        }
    );

    // return this += v
    V3.prototype.add = function (v) {
        this[0] += v[0];
        this[1] += v[1];
        this[2] += v[2];
        return this;
    };
    // return u = this - v
    V3.prototype.diff = function (v, r) {
        r = r || new V3(this);
        r[0] = this[0] - v[0];
        r[1] = this[1] - v[1];
        r[2] = this[2] - v[2];
        return r;
    };
    // return this · v
    V3.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    };
    // return this*v
    V3.prototype.mul = function (v) {
        this[0] *= v[0];
        this[1] *= v[1];
        this[2] *= v[2];
        return this;
    };
    // return normalize(this)
    V3.prototype.norm = function () {
        var len = this.len;
        this[0] /= len;
        this[1] /= len;
        this[2] /= len;
        return this;
    };
    // return u = (this.x*v.x, this.y*v.y, this.z*v.z)
    V3.prototype.prod = function (v, r) {
        r = r || new V3(0);
        r[0] = this[0] * v[0];
        r[1] = this[1] * v[1];
        r[2] = this[2] * v[2];
        return r;
    };
    // return u = this*c
    V3.prototype.prodC = function (c, r) {
        r = r || new V3(0);
        r[0] = this[0] * c;
        r[1] = this[1] * c;
        r[2] = this[2] * c;
        return r;
    };
    // return this*c;
    V3.prototype.scale = function (c) {
        this[0] *= c;
        this[1] *= c;
        this[2] *= c;
        return this;
    };
    // return this = (v.x, v.y, v.z)
    V3.prototype.set = function (v) {
        this[0] = v[0];
        this[1] = v[1];
        this[2] = v[2] || 0;
        return this;
    };
    // return this -= v
    V3.prototype.sub = function (v) {
        this[0] -= v[0];
        this[1] -= v[1];
        this[2] -= v[2];
        return this;
    };
    // return u = this + v
    V3.prototype.sum = function (v, r) {
        r = r || new V3(0);
        r[0] = this[0] + v[0];
        r[1] = this[1] + v[1];
        r[2] = this[2] + v[2];
        return r;
    };

    // return "({this.x},{this.y},{this.z})"
    V3.prototype.toString = function () {
        return `(${this[0]},${this[1]},${this[2]})`;
    };

    public(V3, 'V3');
})();