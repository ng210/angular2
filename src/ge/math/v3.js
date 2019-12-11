(function() {
    // return
    // (x, y, x) or
    // (x[0], x[1], x[2])
    function V3(x, y, z) {
        if (x === undefined || typeof x === 'number') {
            this.x = x || .0;
            this.y = y || .0;
            this.z = z || .0;
        } else if (Array.isArray(x)) {
            this.x = x[0];
            this.y = x[1];
            this.z = x[2];
        } else {
            this.x = x.x || .0;
            this.y = x.y || .0;
            this.z = x.z || .0;
        }
            
        this.length();
        this.constructor = V3;
    }
    // return length*(cos(arg), sin(arg))
    V3.fromPolar = function (a, d, length) {
        var r = Math.cos(d);
        return new V3(r*Math.cos(a), Math.sin(d), r*Math.sin(a)).scale(length);
    };
    // return u = this + v
    V3.prototype.add = function (v) {
        return new V3(this.x + v.x, this.y + v.y, this.z + v.z);
    };
    // return u = this x v
    V3.prototype.cross = function (v) {
        return new V3(this.y*v.z - this.z*v.y, this.z*v.x - this.x*v.z, this.x*v.y - this.y*v.x);
    };
    // return this -= v
    V3.prototype.dec = function (v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    };
    // return this · v
    V3.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    };
    // return this += v
    V3.prototype.inc = function (v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    };
    // return length(this), also set length(this)^2
    V3.prototype.length = function () {
        this.len2 = this.x * this.x + this.y * this.y + this.z*this.z;
        this.len = Math.sqrt(this.len2);
        return this.len;
    };
    // return length(this)^2
    V3.prototype.length2 = function () {
        return this.len2 = this.x * this.x + this.y * this.y + this.z*this.z;
    };
    // return u = (this.x*v.x, this.y*v.y, this.z*v.z)
    V3.prototype.mul = function (v) {
        return new V3(this.x*v.x, this.y*v.y, this.z*v.z);
    };
    // return u = this*c
    V3.prototype.mulC = function (c) {
        var r = new V3(this.x, this.y, this.z);
        return r.scale(c);
    };
    // return normalize(this)
    V3.prototype.norm = function () {
        this.length();
        this.x /= this.len;
        this.y /= this.len;
        this.z /= this.len;
        return this;
    };
    // return this*c;
    V3.prototype.scale = function (c) {
        this.x *= c;
        this.y *= c;
        this.z *= c;
        return this;
    };
    // return this = (v.x, v.y, v.z)
    V3.prototype.set = function (v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    };
    // return u = this - v
    V3.prototype.sub = function (v) {
        return new V3(this.x - v.x, this.y - v.y, this.z - v.z);
    };
    // return "({this.x},{this.y},{this.z})"
    V3.prototype.toString = function () {
        return `(${this.x},${this.y},${this.z})`;
    };

    public(V3, 'V3');
})();