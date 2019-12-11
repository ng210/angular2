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

    function TestNote(frame, note, length) {
        this.frame = frame;
        this.note = note;
        this.length = length;
    }

    function ComplexSeries() {
        var series = {
            'ints': [],
            'floats': [],
            'notes': []
        };
        // data is created in sorting order
        for (var i=0; i<12; i++) {
            var v = Math.sin(i*Math.PI/18.0);
            series.floats.push(new TestData(2*i, i%2?v:1.0-v));
            series.notes.push(new TestNote(2*i, 12+i, 2));
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

	ComplexSeries.prototype.get = function(seriesId, x) {
        // multiple values at the same ix possible!
        var data = [];
        var indices = this.findIndex(seriesId, item => { var diff = Math.abs(item.x - x); return diff <= Number.EPSILON;} );
        var series = this.data[seriesId];
        for (var i=0; i<indices.length; i++) {
            var item = series[indices[i]];
            data.push(item.x, item.y);
        }
        return data;
    };

	ComplexSeries.prototype.set = function(seriesId, x, y) {
        var series = this.data[seriesId];
        // var indices = this.findIndex(seriesId, item => item.x == ix);
        // if (indices.length > 0) {
        //     for (var i=0; i<indices.length; i++) {
        //         var item = series[indices[i]];
        //         var diff = item.y - value;
        //         if (diff <= Number.EPSILON && diff >= -Number.EPSILON) {
        //             var oldValue = series.splice(indices[i], 1)[0];
        //             return oldValue;
        //         }
        //     }
        // }
        var ix = 0;
        while (ix<series.length && (x > series[ix].x || x == series[ix].x && y > series[ix].y)) ix++;
        series.splice(ix, 0, new TestData(x, y));
        return null;
    };

    ComplexSeries.prototype.query = function(seriesId, x, y) {
        return this.findIndex(seriesId, item => item.x == x && item.y == y).length != 0;
    };

    ComplexSeries.prototype.getMin = function(seriesId) {
        var series = this.data[seriesId];
        var result = [NaN, Infinity];
        for (var i=0; i<series.length; i++) {
            if (!isNaN(result[0]) && series[i] != undefined) result[0] = series[i].x;
            if (series[i].y < result[1]) result[1] = series[i].y;
        }
        return result;
    };

    ComplexSeries.prototype.getMax = function(seriesId) {
        var series = this.data[seriesId];
        var result = [0, -Infinity];
        for (var i=0; i<series.length; i++) {
            if (series[i] != undefined) result[0] = series[i].x;
            if (series[i].y > result[1]) result[1] = series[i].y;
        }
        return result;
    };

    public({ 'SimpleSeries': SimpleSeries, 'ComplexSeries': ComplexSeries }, 'TestDataSeries');
})();
