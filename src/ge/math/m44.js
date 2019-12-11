(function() {
    include('/ge/math/v4.js');

    function M44(data, isColumnMajor) {
        // m23: element of row #2 and column #3
        var i = 0;
        if (isColumnMajor) {
            this.m11 = data[i++]; this.m21 = data[i++]; this.m31 = data[i++]; this.m41 = data[i++];
            this.m12 = data[i++]; this.m22 = data[i++]; this.m32 = data[i++]; this.m42 = data[i++];
            this.m13 = data[i++]; this.m23 = data[i++]; this.m33 = data[i++]; this.m43 = data[i++];
            this.m14 = data[i++]; this.m24 = data[i++]; this.m34 = data[i++]; this.m44 = data[i];
        } else {
            this.m11 = data[i++]; this.m12 = data[i++]; this.m13 = data[i++]; this.m14 = data[i++];
            this.m21 = data[i++]; this.m22 = data[i++]; this.m23 = data[i++]; this.m24 = data[i++];
            this.m31 = data[i++]; this.m32 = data[i++]; this.m33 = data[i++]; this.m34 = data[i++];
            this.m41 = data[i++]; this.m42 = data[i++]; this.m43 = data[i++]; this.m44 = data[i];    
        }
        
        this.constructor = M44;
    }

    //                     n11 n12 n13 n14
    //                     n21 n22 n23 n24
    //                     n31 n32 n33 n34
    //                     n41 n42 n43 n44
    // m11 m12 m13 m14
    // m21 m22 m23 m24
    // m31 m32 m33 m34
    // m41 m42 m43 m44

    M44.prototype.mul = function(m44) {
        var data = [
            this.m11 * m44.m11 + this.m12 * m44.m21 + this.m13 * m44.m31 + this.m14 * m44.m41,
            this.m11 * m44.m12 + this.m12 * m44.m22 + this.m13 * m44.m32 + this.m14 * m44.m42,
            this.m11 * m44.m13 + this.m12 * m44.m23 + this.m13 * m44.m33 + this.m14 * m44.m43,
            this.m11 * m44.m14 + this.m12 * m44.m24 + this.m13 * m44.m34 + this.m14 * m44.m44,

            this.m21 * m44.m11 + this.m22 * m44.m21 + this.m23 * m44.m31 + this.m24 * m44.m41,
            this.m21 * m44.m12 + this.m22 * m44.m22 + this.m23 * m44.m32 + this.m24 * m44.m42,
            this.m21 * m44.m13 + this.m22 * m44.m23 + this.m23 * m44.m33 + this.m24 * m44.m43,
            this.m21 * m44.m14 + this.m22 * m44.m24 + this.m23 * m44.m34 + this.m24 * m44.m44,

            this.m31 * m44.m11 + this.m32 * m44.m21 + this.m33 * m44.m31 + this.m34 * m44.m41,
            this.m31 * m44.m12 + this.m32 * m44.m22 + this.m33 * m44.m32 + this.m34 * m44.m42,
            this.m31 * m44.m13 + this.m32 * m44.m23 + this.m33 * m44.m33 + this.m34 * m44.m43,
            this.m31 * m44.m14 + this.m32 * m44.m24 + this.m33 * m44.m34 + this.m34 * m44.m44,

            this.m41 * m44.m11 + this.m42 * m44.m21 + this.m43 * m44.m31 + this.m44 * m44.m41,
            this.m41 * m44.m12 + this.m42 * m44.m22 + this.m43 * m44.m32 + this.m44 * m44.m42,
            this.m41 * m44.m13 + this.m42 * m44.m23 + this.m43 * m44.m33 + this.m44 * m44.m43,
            this.m41 * m44.m14 + this.m42 * m44.m24 + this.m43 * m44.m34 + this.m44 * m44.m44
        ];

        return new M44(data);
    };

    //                     x
    //                     y
    //                     z
    //                     w
    // m11 m12 m13 m14
    // m21 m22 m23 m24
    // m31 m32 m33 m34
    // m41 m42 m43 m44
    M44.prototype.mulV = function(v4) {
        return new V4(
            this.m11 * v4.x + this.m12 * v4.y + this.m13 * v4.z + this.m14 * v4.w,
            this.m21 * v4.x + this.m22 * v4.y + this.m23 * v4.z + this.m24 * v4.w,
            this.m31 * v4.x + this.m32 * v4.y + this.m33 * v4.z + this.m34 * v4.w,
            this.m41 * v4.x + this.m42 * v4.y + this.m43 * v4.z + this.m44 * v4.w
        );
    };

    M44.identity = function() {
        var data = [];
        for (var i=0; i<16; i++) {
            data.push(i%5 == 0 ? 1.0 : .0);
        }
        return new M44(data);
    };

    public(M44, 'M44');

})();