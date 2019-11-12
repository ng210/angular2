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
        for (var i=0; i<20; i++) {
            series.ints.push(new TestData(i, i));
            series.ints.push(new TestData(i, i + 2));
            series.floats.push(new TestData(0.1*i, 0.5*i));
            series.floats.push(new TestData(0.2*i, 0.5*i + 2));
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
        var indices = this.findIndex(seriesId, item => item.x == ix);
        if (indices.length > 0) {
            var series = this.data[seriesId];
            for (var i=0; i<indices.length; i++) {
                var item = series[indices[i]];
                if (item.y == value) {
                    var oldValue = series.splice(indices[i], 1)[0];
                    return oldValue;
                }
            }
            series.splice(ix, 0, new TestData(ix, value));
        }
        return null;
    };

    ComplexSeries.prototype.remove = function(seriesId, ix, value) {

    };

    public({ 'SimpleSeries': SimpleSeries, 'ComplexSeries': ComplexSeries }, 'TestDataSeries');
})();
