include('/ge/noise.js');
include('/ge/fn.js');
include('demo.js');

(function() {
    function NoiseDemo(canvas) {
        Demo.call(this, 'noise', canvas);
        this.noise = new Noise(0);
        this.ctx = canvas.getContext('2d');
        
    }
    extend(Demo, NoiseDemo);

    NoiseDemo.prototype.prepare = function() {
        ;
    };

    NoiseDemo.prototype.initialize = function() {
        var width = this.data.width;
        var height = this.data.height;
        GE.resizeCanvas(width, height);
        // this.ctx.canvas.width = width;
        // this.ctx.canvas.height = height;
        // GE.frontBuffer = GE.frontBuffer.imgData; //this.ctx.getImageData(0, 0, width, height);
    };

    NoiseDemo.prototype.update = function(frame) {
        this.createNoise(GE.frontBuffer, 256, this.data.speed*frame);
    };
    NoiseDemo.prototype.processInputs = function(e) {
	};
    NoiseDemo.prototype.render = function(frame) {
        GE.frontBuffer.blit();
    };
    NoiseDemo.prototype.onchange = function(setting) {
        this.initialize();
    };
    NoiseDemo.prototype.createNoise = function (buffer, depth, dt) {
    	var a0 = this.data.amp0;
    	var f0 = this.data.fre0;
    	var amp = this.data.amp;
        var fre = this.data.fre;
        var width = buffer.width;
        var height = buffer.height;
        var colorScheme = this.ui.controls.color.getSelectedItem().index;
        var z = (dt % (2*depth))/depth;
        if (z > 1) z = 2 - z;
        for (var j=0; j<height; j+=1) {
            var y = j/height;
            var cy = y - 0.5;
            //y += 3*dt/depth;
            for (var i=0; i<width; i+=1) {
                var ix = 4*(i + j*width);
                var x = i/width;
                var cx = x - 0.5;// if (cx == 0) cx = 2.000001;
                var r = Math.sqrt(cx*cx + cy*cy);
                //var v = ns.fbm1d(x, 6, 0.67, 4.3, .52, 3.98);
                //var v = ns_.fbm2d(x, y, 3, 0.67, 4.3, .52, 2.98);
                var v = 1.66*this.noise.fbm3d(x, y, z, 7, a0, f0, amp, fre);
                // var fd = 1.0 - Math.sqrt(cx*cx + cy*cy);
                //var fd = 1.0;
                // fd = Fn.smoothstep(fd*fd);
                // v = v * fd;
                var col = lookUpColor(colorScheme, Fn.clamp(v, 0.0, 1.0));
                buffer.imgData.data[ix+0] = col[0];
                buffer.imgData.data[ix+1] = col[1];
                buffer.imgData.data[ix+2] = col[2];
                buffer.imgData.data[ix+3] = col[3]/2;
            }
        }
    }

    function lookUpColor(tix, v) {
        var tbl = [
            [
                [1.0, 255, 255, 255, 255],
                [0.9, 255, 255, 255, 255],
                [0.8, 255, 240, 128, 255],
                [0.6, 240,  64,  64, 128],
                [0.4,  64,  64,  64,  64],
                [0.0,   0,   0,   0,   0]
            ],
            [
                [1.0, 255, 255, 255, 255],
                [0.9, 255, 255, 255, 255],
                [0.8, 128, 160, 240, 255],
                [0.7,  64,  64, 192, 128],
                [0.5,  64,  64,  64,  64],
                [0.0,   0,   0,   0,   0]
            ]
        ];
        
        var col = [0, 0, 0, 0];
        var tab = tbl[tix];
        var i0 = tab[0];
        for (var i=1; i<tab.length; i++) {
            var i1 = tab[i];
            if (v > i1[0]) {
                var r = (v - i1[0])/(i0[0] - i1[0]);
                for (var j=0; j<4; j++) {
                    col[j] = Math.floor(r*(i0[j+1] - i1[j+1]) + i1[j+1]);
                    //col[j] = i1[j+1];
                }
                break;
            }
            i0 = i1;
        }
        return col;
    }

    public(NoiseDemo, 'NoiseDemo');
})();