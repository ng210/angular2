(function() {
    // return
    // (x, y, x) or
    // (x[0], x[1], x[2])
    function V4(x, y, z, w) {
        if (x === undefined || typeof x === 'number') {
            this.x = x || .0;
            this.y = y || .0;
            this.z = z || .0;
            this.w = w || .0;
        } else if (Array.isArray(x)) {
            this.x = x[0];
            this.y = x[1];
            this.z = x[2];
            this.w = x[3];
        } else {
            this.x = x.x || .0;
            this.y = x.y || .0;
            this.z = x.z || .0;
            this.w = x.w || .0;
        }
            
        this.length();
        this.constructor = V4;
    }
    // return u = this + v
    V4.prototype.add = function (v) {
        return new V4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
    };
    // return this -= v
    V4.prototype.dec = function (v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        this.w -= v.w;
        return this;
    };
    // return this · v
    V4.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    };
    // return this += v
    V4.prototype.inc = function (v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        this.w += v.w;
        return this;
    };
    // return length(this), also set length(this)^2
    V4.prototype.length = function () {
        this.len2 = this.x * this.x + this.y * this.y + this.z*this.z + this.w*this.w;
        this.len = Math.sqrt(this.len2);
        return this.len;
    };
    // return length(this)^2
    V4.prototype.length2 = function () {
        return this.len2 = this.x * this.x + this.y * this.y + this.z*this.z + this.w*this.w;
    };
    // return u = (this.x*v.x, this.y*v.y, this.z*v.z)
    V4.prototype.mul = function (v) {
        return new V4(this.x*v.x, this.y*v.y, this.z*v.z, this.w*v.w);
    };
    // return u = this*c
    V4.prototype.mulC = function (c) {
        var r = new V4(this.x, this.y, this.z, this.w);
        return r.scale(c);
    };
    // return normalize(this)
    V4.prototype.norm = function () {
        this.length();
        this.x /= this.len;
        this.y /= this.len;
        this.z /= this.len;
        this.w /= this.len;
        return this;
    };
    // return this*c;
    V4.prototype.scale = function (c) {
        this.x *= c;
        this.y *= c;
        this.z *= c;
        this.w *= c;
        return this;
    };
    // return this = (v.x, v.y, v.z)
    V4.prototype.set = function (v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z || .0;
        this.w = v.w || .0;
        return this;
    };
    // return u = this - v
    V4.prototype.sub = function (v) {
        return new V4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
    };
    // return "({this.x},{this.y},{this.z})"
    V4.prototype.toString = function () {
        return `(${this.x},${this.y},${this.z},${this.w})`;
    };

    public(V4, 'V4');
})();