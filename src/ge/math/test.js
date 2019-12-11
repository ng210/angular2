include('/ge/math/v2.js');
include('/ge/math/v3.js');
include('/ge/math/v4.js');
include('/ge/math/m33.js');
include('/ge/math/m44.js');

(function(){

    function test_v2() {
        Dbg.prln('Test V2');
        var errors = [];

        var u = new V2([4.0, 5.0]);
        var v = new V2(2.0, 3.0);
        var n = new V2(.0);
        var r = null;
        if (u.x != 4.0 || u.y != 5.0 || v.x != 2.0 || v.y != 3.0 || n.x != 0.0 || n.y != 0.0) {
            errors.push(' - Vector constructor sets wrong values!');
        }

        // fromPolar
        r = V2.fromPolar(0, 10);
        if (r.x != 10.0 || r.y != 0.0) {
            errors.push(' - Vector fromPolar is incorrect!');
        }
        // add
        r = u.add(v);
        if (r.x != 6.0 || r.y != 8.0) {
            errors.push(' - Vector add is incorrect!');
        }
        // dec
        r = new V2(u);
        r.dec(v);
        if (r.x != 2.0 || r.y != 2.0) {
            errors.push(' - Vector dec is incorrect!');
        }
        // dot
        if (u.dot(v) != 2*4 + 3*5) {
            errors.push(' - Vector dot is incorrect!');
        }
        // inc
        r = new V2(u);
        r.inc(v);
        if (r.x != 6.0 || r.y != 8.0) {
            errors.push(' - Vector inc is incorrect!');
        }
        // length
        if (u.length() != Math.sqrt(4*4 + 5*5)) {
            errors.push(' - Vector length is incorrect!');
        }
        // length2
        if (u.length2() != 4*4 + 5*5) {
            errors.push(' - Vector length2 is incorrect!');
        }
        // mul
        r = u.mul(v);
        if (r.x != 8.0 || r.y != 15.0) {
            errors.push(' - Vector mul is incorrect!');
        }
        // mulC
        r = u.mulC(4);
        if (r.x != 16.0 || r.y != 20.0) {
            errors.push(' - Vector mulC is incorrect!');
        }
        // norm
        r = new V2(3, 4).norm();
        if (r.x != .6 || r.y != .8) {
            errors.push(' - Vector norm is incorrect!');
        }
        // scale
        r = new V2(u).scale(4);
        if (r.x != 16.0 || r.y != 20.0) {
            errors.push(' - Vector scale is incorrect!');
        }
        // set
        r = new V2().set(u);
        if (r.x != u.x || r.y != u.y) {
            errors.push(' - Vector set is incorrect!');
        }

        // sub
        r = u.sub(v);
        if (r.x != 2.0 || r.y != 2.0) {
            errors.push(' - Vector sub is incorrect!');
        }

        return errors.length > 0 ? errors.join('\n') : 'Tests successful!';
    }

    function test_v3() {
        Dbg.prln('Test V3');
        var errors = [];

        var u = new V3([4.0, 5.0, 6.0]);
        var v = new V3(2.0, 3.0, 1.0);
        var n = new V3(.0);
        var r = null;
        if (u.x != 4.0 || u.y != 5.0 || u.z != 6.0 ||
            v.x != 2.0 || v.y != 3.0 || v.z != 1.0 ||
            n.x != 0.0 || n.y != 0.0 || n.z != 0.0) {
            errors.push(' - Vector constructor sets wrong values!');
        }

        // fromPolar
        r = V3.fromPolar(0, 0, 10);
        if (r.x != 10.0 || r.y != 0.0 || r.z != 0.0) {
            errors.push(' - Vector fromPolar is incorrect!');
        }
        // add
        r = u.add(v);
        if (r.x != 6.0 || r.y != 8.0 || r.z != 7.0) {
            errors.push(' - Vector add is incorrect!');
        }
        // cross
        r = u.cross(v);
        if (r.x != 5*1 - 6*3 || r.y != 6*2 - 4*1 || r.z != 4*3 - 5*2) {
            errors.push(' - Vector cross is incorrect!');
        }
        // dec
        r = new V3(u);
        r.dec(v);
        if (r.x != 2.0 || r.y != 2.0 || r.z != 5.0) {
            errors.push(' - Vector dec is incorrect!');
        }
        // dot
        if (u.dot(v) != 2*4 + 3*5 + 6*1) {
            errors.push(' - Vector dot is incorrect!');
        }
        // inc
        r = new V3(u);
        r.inc(v);
        if (r.x != 6.0 || r.y != 8.0 || r.z != 7.0) {
            errors.push(' - Vector inc is incorrect!');
        }
        // length
        if (u.length() != Math.sqrt(4*4 + 5*5 + 6*6)) {
            errors.push(' - Vector length is incorrect!');
        }
        // length2
        if (u.length2() != 4*4 + 5*5 + 6*6) {
            errors.push(' - Vector length2 is incorrect!');
        }
        // mul
        r = u.mul(v);
        if (r.x != 8.0 || r.y != 15.0 || r.z != 6.0) {
            errors.push(' - Vector mul is incorrect!');
        }
        // mulC
        r = u.mulC(4);
        if (r.x != 16.0 || r.y != 20.0 || r.z != 24.0) {
            errors.push(' - Vector mulC is incorrect!');
        }
        // norm
        r = new V3(2, 3, 6).norm();
        if (r.x != 2/7 || r.y != 3/7 || r.z != 6/7) {
            errors.push(' - Vector norm is incorrect!');
        }
        // scale
        r = new V3(u).scale(4);
        if (r.x != 16.0 || r.y != 20.0) {
            errors.push(' - Vector scale is incorrect!');
        }
        // set
        r = new V3().set(u);
        if (r.x != u.x || r.y != u.y || r.z != u.z) {
            errors.push(' - Vector set is incorrect!');
        }

        // sub
        r = u.sub(v);
        if (r.x != 2.0 || r.y != 2.0 || r.z != 5.0) {
            errors.push(' - Vector sub is incorrect!');
        }

        return errors.length > 0 ? errors.join('\n') : 'Tests successful!';
    }

    function test_v4() {
        Dbg.prln('Test V4');
        var errors = [];

        var u = new V4([4.0, 5.0, 6.0, 7.0]);
        var v = new V4(2.0, 3.0, 1.0, -1.0);
        var n = new V4(.0);
        var r = null;
        if (u.x != 4.0 || u.y != 5.0 || u.z != 6.0 || u.w != 7.0 ||
            v.x != 2.0 || v.y != 3.0 || v.z != 1.0 || v.w != -1.0 ||
            n.x != 0.0 || n.y != 0.0 || n.z != 0.0 || n.w != 0.0) {
            errors.push(' - Vector constructor sets wrong values!');
        }

        // add
        r = u.add(v);
        if (r.x != 6.0 || r.y != 8.0 || r.z != 7.0 || r.w != 6.0) {
            errors.push(' - Vector add is incorrect!');
        }

        // dec
        r = new V4(u);
        r.dec(v);
        if (r.x != 2.0 || r.y != 2.0 || r.z != 5.0 || r.w != 8.0) {
            errors.push(' - Vector dec is incorrect!');
        }
        // dot
        if (u.dot(v) != 2*4 + 3*5 + 6*1 + 7*-1) {
            errors.push(' - Vector dot is incorrect!');
        }
        // inc
        r = new V4(u);
        r.inc(v);
        if (r.x != 6.0 || r.y != 8.0 || r.z != 7.0 || r.w != 6.0) {
            errors.push(' - Vector inc is incorrect!');
        }
        // length
        if (u.length() != Math.sqrt(4*4 + 5*5 + 6*6 + 7*7)) {
            errors.push(' - Vector length is incorrect!');
        }
        // length2
        if (u.length2() != 4*4 + 5*5 + 6*6 + 7*7) {
            errors.push(' - Vector length2 is incorrect!');
        }
        // mul
        r = u.mul(v);
        if (r.x != 8.0 || r.y != 15.0 || r.z != 6.0 || r.w != -7.0) {
            errors.push(' - Vector mul is incorrect!');
        }
        // mulC
        r = u.mulC(4);
        if (r.x != 16.0 || r.y != 20.0 || r.z != 24.0 || r.w != 28.0) {
            errors.push(' - Vector mulC is incorrect!');
        }
        // norm
        // 4 9 16 25 36 49 64 81 100 121 144 169 196 225 256
        r = new V4(2, 3, 4, 14).norm();
        if (r.x != 2/15 || r.y != 3/15 || r.z != 4/15 || r.w != 14/15) {
            errors.push(' - Vector norm is incorrect!');
        }
        // scale
        r = new V4(u).scale(4);
        if (r.x != 16.0 || r.y != 20.0 || r.z != 24.0 || r.w != 28.0) {
            errors.push(' - Vector scale is incorrect!');
        }
        // set
        r = new V4().set(u);
        if (r.x != u.x || r.y != u.y || r.z != u.z || r.w != u.w) {
            errors.push(' - Vector set is incorrect!');
        }

        // sub
        r = u.sub(v);
        if (r.x != 2.0 || r.y != 2.0 || r.z != 5.0 || r.w != 8.0) {
            errors.push(' - Vector sub is incorrect!');
        }

        return errors.length > 0 ? errors.join('\n') : 'Tests successful!';
    }

    function test_m33() {
        Dbg.prln('Test M33');
        var errors = [];
        var skip = false;
        var r = null;

        var m1 = new M33([1,2,3, 4,5,6, 7,8,9]);
        var m2 = new M33([1,2,3, 4,5,6, 7,8,9], true);
        var m3 = M33.identity();
        for (var i=0; i<3 && skip == false; i++) {
            for (var j=0; j<3 && skip == false; j++) {
                if (m1[`m${i+1}${j+1}`] != 1 + 3*i + j) {
                    skip = true;
                }
                if (m2[`m${j+1}${i+1}`] != 1 + 3*i + j) {
                    skip = true;
                }
                if (m3[`m${j+1}${i+1}`] != (i == j ? 1 : 0)) {
                    skip = true;
                }
            }
        }
        if (skip) {
            errors.push(' - Matrix constructor sets wrong values!');
        }
        // mul
        r = m1.mul(m3);
        for (var i=0; i<3 && skip == false; i++) {
            for (var j=0; j<3 && skip == false; j++) {
                if (r[`m${i+1}${j+1}`] != m1[`m${i+1}${j+1}`]) {
                    skip = true;
                }
            }
        }
        if (skip) {
            errors.push(' - Matrix mul is incorrect!');
        }
        // mulV
        var v = new V3(1, 2, 3);
        r = m1.mulV(v);
        if (r.x != 14 || r.y != 32 || r.z != 50) {
            errors.push(' - Matrix mulV is incorrect!');
        }
        

        return errors.length > 0 ? errors.join('\n') : 'Tests successful!';
    }

    function test_m44() {
        Dbg.prln('Test M44');
        var errors = [];
        var skip = false;
        var r = null;

        var m1 = new M44([1,2,3, 4,5,6, 7,8,9]);
        var m2 = new M44([1,2,3, 4,5,6, 7,8,9], true);
        var m3 = M33.identity();
        for (var i=0; i<3 && skip == false; i++) {
            for (var j=0; j<3 && skip == false; j++) {
                if (m1[`m${i+1}${j+1}`] != 1 + 3*i + j) {
                    skip = true;
                }
                if (m2[`m${j+1}${i+1}`] != 1 + 3*i + j) {
                    skip = true;
                }
                if (m3[`m${j+1}${i+1}`] != (i == j ? 1 : 0)) {
                    skip = true;
                }
            }
        }
        if (skip) {
            errors.push(' - Matrix constructor sets wrong values!');
        }
        // mul
        r = m1.mul(m3);
        for (var i=0; i<3 && skip == false; i++) {
            for (var j=0; j<3 && skip == false; j++) {
                if (r[`m${i+1}${j+1}`] != m1[`m${i+1}${j+1}`]) {
                    skip = true;
                }
            }
        }
        if (skip) {
            errors.push(' - Matrix mul is incorrect!');
        }
        // mulV
        var v = new V3(1, 2, 3);
        r = m1.mulV(v);
        if (r.x != 14 || r.y != 32 || r.z != 50) {
            errors.push(' - Matrix mulV is incorrect!');
        }
        return errors.length > 0 ? errors.join('\n') : 'Tests successful!';
    }

    var tests = async function() {
        Dbg.prln(test_v2());
        Dbg.prln(test_v3());
        Dbg.prln(test_v4());
        Dbg.prln(test_m33());
        Dbg.prln(test_m44());
        return 0;
    };
    public(tests, 'Math tests');
})();