(function() {

    function V2(x, y, z, w) {
        if (x === undefined || typeof x === 'number') {
            if (arguments.length < 2) y = x, z = x, w = x;
            this[0] = x || .0;
            this[1] = y || .0;
        } else if (Array.isArray(x)) {
            this[0] = x[0] || .0;
            this[1] = x[1] || .0;
        } else if (x instanceof Float32Array) {
            this[0] = x[0];
            this[1] = x[1];
        } else {
            throw new Error('Could not create V2 from these arguments!');
        }
    }
    V2.prototype = new Float32Array(2);
    Object.defineProperties(V2.prototype,
        {
            x: { get: function() { return this[0]; }, set: function(x) { this[0] = x; } },
            y: { get: function() { return this[1]; }, set: function(y) { this[1] = y; } },
            len: { get: function() { return Math.sqrt(this.len2); } },
            len2: { get: function() { return this[0]*this[0] + this[1]*this[1]; } }
        }
    );

    // return this += v
    V2.prototype.add = function (v) {
        this[0] += v[0];
        this[1] += v[1];
        return this;
    };
    // return u = this - v
    V2.prototype.diff = function (v, r) {
        r = r || new V2(this);
        r[0] = this[0] - v[0];
        r[1] = this[1] - v[1];
        return r;
    };
    // return this · v
    V2.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y;
    };
    // return this*v
    V2.prototype.mul = function (v) {
        this[0] *= v[0];
        this[1] *= v[1];
        return this;
    };
    // return normalize(this)
    V2.prototype.norm = function () {
        var len = this.len;
        this[0] /= len;
        this[1] /= len;
        return this;
    };
    // return u = (this.x*v.x, this.y*v.y, this.z*v.z)
    V2.prototype.prod = function (v, r) {
        r = r || new V2(0);
        r[0] = this[0] * v[0];
        r[1] = this[1] * v[1];
        return r;
    };
    // return u = this*c
    V2.prototype.prodC = function (c, r) {
        r = r || new V2(0);
        r[0] = this[0] * c;
        r[1] = this[1] * c;
        return r;
    };
    // return this*c;
    V2.prototype.scale = function (c) {
        this[0] *= c;
        this[1] *= c;
        return this;
    };
    // return this = (v.x, v.y, v.z)
    V2.prototype.set = function (v) {
        this[0] = v[0];
        this[1] = v[1];
        return this;
    };
    // return this -= v
    V2.prototype.sub = function (v) {
        this[0] -= v[0];
        this[1] -= v[1];
        return this;
    };
    // return u = this + v
    V2.prototype.sum = function (v, r) {
        r = r || new V2(0);
        r[0] = this[0] + v[0];
        r[1] = this[1] + v[1];
        return r;
    };

    // return "({this.x},{this.y},{this.z})"
    V2.prototype.toString = function () {
        return `(${this[0]},${this[1]})`;
    };

    public(V2, 'V2');
})();