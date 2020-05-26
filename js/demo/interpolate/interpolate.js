(function() {
	
    function Interpolate(canvas) {
		Demo.call(this, 'interpolate', canvas);
        this.points = [];
        this.time = 0;
        this.frame = 0;
        
    }
    extend(Demo, Interpolate);

    Interpolate.prototype.functions = {
        "none": x => 0.0,
        "linear": x => x,
        "sinusoid": x => 0.5*(1.0 - Math.cos(Math.PI*x)),
        "smoothstep": x => x*(3*x-2*x*x)
    };
    Interpolate.prototype.prepare = async function() { ; };
    Interpolate.prototype.createPoints = function() {
        delete this.points;
        this.points = [];
        var nrand = new Date().getTime();
        for (var i=0; i<this.data.points; i++) {
            this.points.push((nrand % 1000)/500 - 1.0);
            nrand = (nrand*2) % 2018753417;
        }
    };
    Interpolate.prototype.initialize = function() {
        // create data
        this.createPoints();
        GE.resizeCanvas(1.5);
    };
    Interpolate.prototype.processInputs = function() { ; };
    Interpolate.prototype.onchange = function(setting) {
        switch (setting.dataField) {
            case 'points':
                this.createPoints();
                break;
            case 'function':
                this.time = 0;
                this.frame = 0;
                break;
        }
    };
    Interpolate.prototype.update = function(frame, dt) { ; };
    Interpolate.prototype.render = function(frame, dt) {
        var t = new Date().getTime();
        // erase background
		GE.ctx.fillStyle = '#0e1028';
        GE.ctx.fillRect(0, 0, GE.frontBuffer.width, GE.frontBuffer.height);
        GE.ctx.strokeStyle = '#3840a0';
        GE.ctx.lineWidth = 1;
        var scaleY = GE.frontBuffer.height/2;
        var scaleX = this.points.length/GE.frontBuffer.width;
        GE.ctx.beginPath();
        GE.ctx.moveTo(0, scaleY*(1.0 + this.points[0]));
        for (var x=0; x < GE.frontBuffer.width; x++) {
            var dx = scaleX*x;
            var x1 = Math.floor(dx);
            var x0 = x1 > 0 ? x1 - 1 : 0;
            dx -= x1;
            var y1 = this.points[x1], y0 = this.points[x0];
            var dy = y1 - y0;
            var y = scaleY * (1.0 + y0 + dy*this.functions[this.data.function](dx));
            GE.ctx.lineTo(x, y);
        }
        GE.ctx.stroke();
        this.time += new Date().getTime() - t;
        this.frame++;
        if (this.frame % 8 == 0) {
            var fps = 1000*this.frame/this.time;
            this.ui.controls.time.setValue(fps.toPrecision(4));
        }
    };
    public(Interpolate, 'Interpolate');
})();
