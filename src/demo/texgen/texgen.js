include('/ge/fn.js');
include('/ge/noise.js');

(function() {
    function TexGen(canvas) {
        Demo.call(this, 'texgen', canvas);
        this.isChanged = true;
        this.noises = [];
        this.filters = [];
        this.srcBuffer = null;
        this.dstBuffer = null;

        this.constructor = TexGen;
    }
    TexGen.prototype = new Demo();

    TexGen.prototype.prepare = async function() {
    };
    TexGen.prototype.initialize = function() {
        this.onresize();
        for (var i=0; i<this.data.noises.length; i++) {
            this.noises.push(new Noise(new Date().getTime()));
            this.noises.push(new Noise(new Date().getTime()));
            this.noises.push(new Noise(new Date().getTime()));
        }
        for (var i=0; i<this.data.filters.length; i++) {
            this.filters.push(new Fn.Filter(this.data.filters[i].matrix));
        }
    };
    TexGen.prototype.createUi = function(node) {
        Demo.prototype.createUi.call(this, node);
        // create noise and filter panels
    };
    TexGen.prototype.processInputs = function() {
    };
    TexGen.prototype.swapBuffers = function() {
        var tmp = this.srcBuffer;
        this.srcBuffer= this.dstBuffer;
        this.dstBuffer = tmp;
    };
    TexGen.prototype.update = function(frame, dt) {
        if (this.isChanged) {
            // clear destination buffer
            this.dstBuffer.clear();
            this.mix(this.srcBuffer, this.dstBuffer, 1.0);
            var ni = 0, fi = 0;
            var mix = 1.0;
            while (this.isChanged) {
                var noise = this.data.noises[ni];
                if (noise && noise.on === true) {
                    noise = this.noises[3*ni];
                    // create noise into dst
                    this.createNoise(ni, this.dstBuffer, mix, dt);
                    this.swapBuffers();
                }
                var filter = this.data.filters[fi];
                if (filter && filter.on === true) {
                    filter = this.filters[fi];
                    // filter src into dst
                    this.filter(filter, this.srcBuffer, this.dstBuffer);
                    this.swapBuffers();
                }
                if (!noise && !filter) {
                    this.isChanged = false;
                }
                ni++;
                fi++;
            }
        }
    };
    TexGen.prototype.mix = function(bIn, bOut) {
        var ix = 0;
        var f = 0.2;
        for (var j=0; j<bIn.width; j++) {
            for (var i=0; i<bIn.width; i++) {
                bOut.imgData.data[ix] = bIn.imgData.data[ix] * f;
                bOut.imgData.data[ix+1] = bIn.imgData.data[ix+1] * f;
                bOut.imgData.data[ix+2] = bIn.imgData.data[ix+2] * f;
                bOut.imgData.data[ix+3] = 255;
                ix += 4;
            }
        }
    };
    TexGen.prototype.render = function(frame, dt) {
        this.srcBuffer.blit();
    };
    TexGen.prototype.onchange = function(setting) {
        this.isChanged = true;
        this.onresize();
    };
    TexGen.prototype.createNoise = function(ni, buffer, mix, dt) {
        var ix = 0;
        var noiseR = this.noises[3*ni];
        var noiseG = this.noises[3*ni+1];
        var noiseB = this.noises[3*ni+2];
        var data = this.data.noises[ni];
        if (data.on === true) {
            for (var j=0; j<buffer.height; j++) {
                var y = j/buffer.height;
                for (var i=0; i<buffer.width; i++) {
                    //var ix = 4*(i + j*buffer.width);
                    var x = i/buffer.width;
                    var r = noiseR.fbm2d(x, y, 3, data.amp, data.fre, data.amp, data.fre);
                    var g = noiseG.fbm2d(x, y, 3, data.amp, data.fre, data.amp, data.fre);
                    var b = noiseB.fbm2d(x, y, 3, data.amp, data.fre, data.amp, data.fre);
                    r = Fn.lerp(buffer.imgData.data[ix+0], Math.floor(255*Fn.clamp(r, 0.0, 1.0)), mix);
                    g = Fn.lerp(buffer.imgData.data[ix+1], Math.floor(255*Fn.clamp(g, 0.0, 1.0)), mix);
                    b = Fn.lerp(buffer.imgData.data[ix+2], Math.floor(255*Fn.clamp(b, 0.0, 1.0)), mix);
                    buffer.imgData.data[ix++] = r;
                    buffer.imgData.data[ix++] = g;
                    buffer.imgData.data[ix++] = b;
                    buffer.imgData.data[ix++] = 255;
                }
            }
        }
    };
    TexGen.prototype.filter = function(filter, bufferIn, bufferOut) {
        var ix = 0;
        for (var j=0; j<bufferIn.height; j++) {
            for (var i=0; i<bufferIn.width; i++) {
                for (var ci=0; ci<4; ci++) {
                    var v = filter.apply(bufferIn.imgData.data, bufferIn.width, bufferIn.height, 4, i, j, ci);
                    bufferOut.imgData.data[ix++] = Math.floor(v);
                }
            }   
        }
    };
    TexGen.prototype.onresize = function() {
        GE.resizeCanvas(this.data.width, this.data.height);
        this.srcBuffer = GE.frontBuffer;
        this.dstBuffer = GE.backBuffer;
    };

    public(TexGen, 'TexGen');

})();