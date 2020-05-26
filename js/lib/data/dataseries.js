 (function() {

/******************************************************************************
 Data series are at least 2 dimensional, enumerable, sortable structures. They
 store lists of vectors (x, y[, ...]). The list is sorted by x to improve search
 performance. A value may not exist at the requested index.
 Supported methods
 - info getInfo()
 - v get(x)
 - set(v)
 - removeAt(x)
 - v getRange(start, end)
 - setRange(start, end, value)
******************************************************************************/
    function DataSeries(enumerable) {
        this.data = enumerable || [];
        // strict permits the storage of values sharing the same x
        this.isStrict = false;
    }

    DataSeries.prototype.compare = function(a, b) {
        var dx = a[0] - b[0];
        var dy = a[1] - b[1];
        if (!isNaN(dx)) {
            if (dx != 0 || isNaN(dy)) {
                return dx;
            }
            return dy;
            
        } else {
            if (!isNaN(dy)) {
                return dy;
            }
        }
        throw new Error('Invalid input, empty vector found!');
    };

    DataSeries.prototype.between = function(v, min, max) {
        var x1 = min[0] != undefined ?  min[0] : -Infinity;
        var y1 = min[1] != undefined ?  min[1] : -Infinity;
        var x2 = max[0] != undefined ?  max[0] : Infinity;
        var y2 = max[1] != undefined ?  max[1] : Infinity;
        if (x1 > x2) { var tmp = x1; x1 = x2; x2 = tmp; }
        if (y1 > y2) { var tmp = y1; y1 = y2; y2 = tmp; }
        return  x1 <= v[0] && v[0] <= x2 && y1 <= v[1] && v[1] <= y2;
    };

    DataSeries.prototype.iterate_ = function(start, end, callback) {
        var args = Array.from(arguments);
        var ix = this.data.binSearch(start, this.compare);
        if (ix < 0) ix = -ix;
        var it = { start:start, end:end, ix:ix };
//console.log(it.ix);
        while (it.ix < this.data.length) {
            var value = this.data[it.ix];
            if (this.between(value, start, end)) {
                args[0] = value;
                args[1] = it;
                args[2] = this;
//console.log(it.ix+ ' . .  .  . ' + JSON.stringify(value));
                result = callback.apply(this, args);
            }
            it.ix++;
        }
    };

    DataSeries.prototype.iterate = function(start, end, callback) {
        if (arguments.length == 1) {
            // iterate(callback)
            callback = start; start = this.data[0][0]; end = this.data[this.data.length-1][0];
        } else if (arguments.length == 2) {
            // iterate(start, callback)
            callback = end; end = this.data[this.data.length-1][0];
        }
        // iterate(start, end, callback)
        if (typeof start === 'number') start = [start];
        if (typeof end === 'number') end = [end];
        this.iterate_(start, end, callback);
    };

    // return min and max values
    DataSeries.prototype.getInfo = function() {
        var info = {
            min: [ this.data[0][0],  Infinity ],
            max: [ this.data[this.data.length-1][0], -Infinity ]
        };
        for (var i=0; i<this.data.length; i++) {
            var value = this.data[i];
            if (info.min[1] > value[1]) info.min[1] = value[1];
            if (info.max[1] < value[1]) info.max[1] = value[1];
        }
        return info;
    };

    // returns the values with the first component equal to x
    DataSeries.prototype.get = function(x) {
        var values = [];
        var v = Array.isArray(x) ? x : [x];
        this.iterate_(v, v, value => values.push(value));
        return values;
    };

    // returns the values with [x,y] between start [x,y] and end [x,y]
    // undefined skips the check
    DataSeries.prototype.getRange = function(start, end) {
        var values = [];
        this.iterate_(start, end, value => values.push(value));
        return values;
    };

    // add or update the value
    DataSeries.prototype.set = function(value) {
        var key = [value[0],];
        var ix = this.data.binSearch(key, this.compare);
        if (ix < 0) {
            this.data.splice(-ix, 0, value);
        } else {
            if (this.isStrict) {
                this.data[ix] = value;
            } else {
                this.data.splice(ix, 0, value);
            }
        }
        return value;
    };

    // remove the value
    DataSeries.prototype.remove = function(value) {
        var ix = this.data.binSearch(value, this.compare);
        if (ix > 0) {
            this.data.splice(ix, 1);
        }
    };

    // remove the values between start and end
    DataSeries.prototype.removeRange = function(start, end) {
        var values = [];
        for (var i=0; i<this.data.length; i++) {
            var value = this.data[i];
            if (!this.between(value, start, end)) {
                values.push(value);
            }
        }
        this.data = values;
    };

    public(DataSeries, 'DataSeries');
})();
