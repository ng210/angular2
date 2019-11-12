 (function() {
/******************************************************************************
 Data series are 2 dimensional, enumerable structures. The first dimension is
 the series, the second dimension indexes a value within the selected series.
 - A value may not exist at the requested index.
 - The series may not share a common range.
 The 3 main methods are 'get' and 'set' and 'getRange'.
 
 Array get(seriesId, x)
 Returns every value stored at the selected x within the requested series as
 an array or null.
 - The selected series is iterated to locate entries with the given x.
 - The values of the matching entries are added to the result along with the x
   to form [x,y] pairs (data points). These pairs are written as 2 numbers.
 - The method returns null if a series identified by 'seriesId' or a value at x
   cannot be found.
 
 Value set(seriesId, x, y)
 This method sets, modifies or removes an entry at the requested x within the
 selected series and eventually returns the old value.
 - The selected series is searched for entries with the given x and y value.
 - If an entry was
     - found, it will be removed or
     - not found it will be set or modified
 - Set and modify are distinguished only by looking at the internal structure:
   - value at x does not match y, the value is modified to y,
   - value at x is different from y, a new value is added and set to y.
 - A series may allow or deny the storage of multiple values at the same x.
   - With multiple values allowed, the 'get' method can return more than one
     data point and 'getRange' can return multiple values with the same x.
 
 Values getRange(seriesId, Info)
 Returns an array of data points, selected by parameters in the Info structure.
 The data points are written as 2 values x and y.
 as a flat Array, and returns information about the range.
 - The information includes 3 input parameters
     - step: size of step along the x axis,
     - start: start of the range of x values,
     - end: end of the range of x values,
   and 3 output parameters
     - count: count of data points within the range,
     - min: a data point with the smallest x and y within the range,
     - max: a data point with the biggest x and y within the range,
 - The points in 'data' are sorted by x ascending.
 - The iteration tries to get a value from the selected series for each x.
 - If a value could be retrieved it is stored in the output array as a data
   point with x and y.
 - The count of minimum and maximum of x and y are stored in the info.
******************************************************************************/
    function IDataSeries(enumerable) {
        this.data = enumerable || [ [] ];
    }

    // The default implementation assumes a data source of a single series
    // containing simple values only, thus the seriesId is always 0.
    // Examples:
    //   [ [1, 3, 6, 7, 9, 10, ...] ] or
    //   { 'values': [0.1, 0.4, 0.8, 0.3, -0.2] }

    IDataSeries.prototype.get = function(seriesId, ix) {
        var series = this.data[seriesId];
        return (series && series[ix] != undefined) ? [ix, series[ix]] : null;
    };

    IDataSeries.prototype.set = function(seriesId, ix, value) {
        if (this.data[seriesId] == undefined) {
            this.data[seriesId] = [];
        }
        var series = this.data[seriesId];
        if (series[ix] != undefined) {
            if (this.remove(seriesId, ix) == value) return;
        }
        series[ix] = value;
    };

    IDataSeries.prototype.getRange = function(seriesId, range) {
        var count = 0, min = null, max = null;
        var data = [];
        if (seriesId != undefined) {
            min = [0, Infinity];
            max = [0, -Infinity];
            for (var x=range.start; x<range.end; x+=range.step) {
                var points = this.get(seriesId, x);
                // get returns data points in the form of an Array
                // [x1, y1, x2, y2, ..., xN, yN]
                if (points != null) {
                    for (var i=0; i<points.length; i += 2) {
                        var x = points[i];
                        var y = points[i+1];
                        if (min[1] > y) {
                            min[0] = x;
                            min[1] = y;
                        }
                        if (max[1] < y) {
                            max[0] = x;
                            max[1] = y;
                        }
                        data.push(x, y);
                        count++;
                    }
                }
            }
        }
        range.count = count;
        range.min = min;
        range.max = max;
        return data;
    };

    // IDataSeries.prototype.add = function(index, chnId) { throw new Error('Not implemented!'); };
    IDataSeries.prototype.remove = function(seriesId, ix, value) {
        var series = this.data[seriesId];
        var oldValue = null;
        if (series != undefined) {
            oldValue = series[ix];
            series[ix] = undefined;
        }
        return oldValue;
    };

    public(IDataSeries, 'IDataSeries');
})();
