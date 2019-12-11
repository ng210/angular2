(function() {
    // return
    // (x, y) or
    // (x[0], x[1])
    function V2(x, y) {
        if (x === undefined || typeof x === 'number') {
            this.x = x || .0;
            this.y = y || .0;
        } else if (Array.isArray(x)) {
            this.x = x[0];
            this.y = x[1];
        } else {
            this.x = x.x || 0.0;
            this.y = x.y || 0.0;
        }
        this.length();
        this.constructor = V2;
    }
    // return length*(cos(arg), sin(arg))
    V2.fromPolar = function (arg, length) {
        return new V2(Math.cos(arg), Math.sin(arg)).scale(length);
    };
    // return u = this + v
    V2.prototype.add = function (v) {
        return new V2(this.x + v.x, this.y + v.y);
    };
    // return this -= v
    V2.prototype.dec = function (v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    };
    // return this · v
    V2.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y;
    };
    // return this += v
    V2.prototype.inc = function (v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    };
    // return length(this), also set length(this)^2
    V2.prototype.length = function () {
        this.len2 = this.x * this.x + this.y * this.y;
        this.len = Math.sqrt(this.len2);
        return this.len;
    };
    // return length(this)^2
    V2.prototype.length2 = function () {
        return this.len2 = this.x * this.x + this.y * this.y;
    };
    // return u = (this.x*v.x, this.y*v.y)
    V2.prototype.mul = function (v) {
        return new V2(this.x*v.x, this.y*v.y);
    };
    // return u = this*c
    V2.prototype.mulC = function (c) {
        var v = new V2(this.x, this.y);
        return v.scale(c);
    };
    // return normalize(this)
    V2.prototype.norm = function () {
        this.length();
        this.x /= this.len;
        this.y /= this.len;
        return this;
    };
    // return this*c;
    V2.prototype.scale = function (c) {
        this.x *= c;
        this.y *= c;
        return this;
    };
    // return this = (v.x, v.y)
    V2.prototype.set = function (v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    };
    // return u = this - v
    V2.prototype.sub = function (v) {
        return new V2(this.x - v.x, this.y - v.y);
    };
    // return "({this.x},{this.y})"
    V2.prototype.toString = function () {
        return `(${this.x},${this.y})`;
    };

    public(V2, 'V2');
})();