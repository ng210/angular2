include('/ui/idataseries.js');
(function() {

    // Uses a simple array
    function SimpleSeries() {
        var series = [ [], [] ];
        // data is created in sorting order
        for (var i=0; i<20; i++) {
            series[0].push(i%2 ? i : undefined);
            series[1].push(1 - (i%2) ? 20-i : undefined);
        }
        IDataSeries.call(this, series);
        this.constructor = SimpleSeries;
    }
    SimpleSeries.prototype = new IDataSeries;


    function TestData(x, y) {
        this.x = x;
        this.y = y;
    }

    function ComplexSeries() {
        var series = {
            'ints': [],
            'floats': []
        };
        // data is created in sorting order
        for (var i=0; i<36; i++) {
            var v = 0.5*(1.0 + Math.sin(i*Math.PI/18.0));
            var vi = Math.floor(20.0*v);
            series.ints.push(new TestData(i, vi));
            series.ints.push(new TestData(i, Math.floor(10.0-0.5*vi)));
            series.floats.push(new TestData(0.1*i, v));
            series.floats.push(new TestData(0.2*i, 1.0 - v));
        }
        IDataSeries.call(this, series);
        this.constructor = ComplexSeries;
    }
    ComplexSeries.prototype = new IDataSeries;

    ComplexSeries.prototype.findIndex = function(seriesId, callback) {
        var indices = [];
        var series = this.data[seriesId];
        if (series) {
            for (var i in series) {
                if (callback(series[i], i, series)) {
                    indices.push(i);
                }
            }
        }
        return indices;
    };

	ComplexSeries.prototype.get = function(seriesId, ix) {
        // multiple values at the same ix possible!
        var data = [];
        var indices = this.findIndex(seriesId, item => item.x == ix);
        var series = this.data[seriesId];
        for (var i=0; i<indices.length; i++) {
            var item = series[indices[i]];
            data.push(item.x, item.y);
        }
        return data;
    };

	ComplexSeries.prototype.set = function(seriesId, ix, value) {
        var series = this.data[seriesId];
        var indices = this.findIndex(seriesId, item => item.x == ix);
        if (indices.length > 0) {
            for (var i=0; i<indices.length; i++) {
                var item = series[indices[i]];
                var diff = item.y - value;
                if (diff <= Number.EPSILON && diff >= -Number.EPSILON) {
                    var oldValue = series.splice(indices[i], 1)[0];
                    return oldValue;
                }
            }
        }
        series.splice(ix, 0, new TestData(ix, value));
        return null;
    };

    ComplexSeries.prototype.remove = function(seriesId, ix, value) {

    };

    public({ 'SimpleSeries': SimpleSeries, 'ComplexSeries': ComplexSeries }, 'TestDataSeries');
})();
