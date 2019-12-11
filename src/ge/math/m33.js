(function() {
    function M33(data, isColumnMajor) {
        // m23: element of row #2 and column #3
        var i = 0;
        if (isColumnMajor) {
            this.m11 = data[i++]; this.m21 = data[i++]; this.m31 = data[i++];
            this.m12 = data[i++]; this.m22 = data[i++]; this.m32 = data[i++];
            this.m13 = data[i++]; this.m23 = data[i++]; this.m33 = data[i++];
        } else {
            this.m11 = data[i++]; this.m12 = data[i++]; this.m13 = data[i++];
            this.m21 = data[i++]; this.m22 = data[i++]; this.m23 = data[i++];
            this.m31 = data[i++]; this.m32 = data[i++]; this.m33 = data[i++];
        }
        
        this.constructor = M33;
    }

    //              n11 n12 n13
    //              n21 n22 n23
    //              n31 n32 n33
    // m11 m12 m13
    // m21 m22 m23
    // m31 m32 m33

    M33.prototype.mul = function(m33) {
        var data = [
            this.m11 * m33.m11 + this.m12 * m33.m21 + this.m13 * m33.m31,
            this.m11 * m33.m12 + this.m12 * m33.m22 + this.m13 * m33.m32,
            this.m11 * m33.m13 + this.m12 * m33.m23 + this.m13 * m33.m33,

            this.m21 * m33.m11 + this.m22 * m33.m21 + this.m23 * m33.m31,
            this.m21 * m33.m12 + this.m22 * m33.m22 + this.m23 * m33.m32,
            this.m21 * m33.m13 + this.m22 * m33.m23 + this.m23 * m33.m33,

            this.m31 * m33.m11 + this.m32 * m33.m21 + this.m33 * m33.m31,
            this.m31 * m33.m12 + this.m32 * m33.m22 + this.m33 * m33.m32,
            this.m31 * m33.m13 + this.m32 * m33.m23 + this.m33 * m33.m33,

            this.m41 * m33.m11 + this.m42 * m33.m21 + this.m43 * m33.m31,
            this.m41 * m33.m12 + this.m42 * m33.m22 + this.m43 * m33.m32,
            this.m41 * m33.m13 + this.m42 * m33.m23 + this.m43 * m33.m33,
        ];

        return new M33(data);
    };

    //                     x
    //                     y
    //                     z
    //                     w
    // m11 m12 m13 m14
    // m21 m22 m23 m24
    // m31 m32 m33 m34
    // m41 m42 m43 m44
    M33.prototype.mulV = function(v3) {
        return new V3(
            this.m11 * v3.x + this.m12 * v3.y + this.m13 * v3.z,
            this.m21 * v3.x + this.m22 * v3.y + this.m23 * v3.z,
            this.m31 * v3.x + this.m32 * v3.y + this.m33 * v3.z
        );
    };

    M33.identity = function() {
        var data = [];
        for (var i=0; i<9; i++) {
            data.push(i%4 == 0 ? 1.0 : .0);
        }
        return new M33(data);
    };

    public(M33, 'M33');

})();