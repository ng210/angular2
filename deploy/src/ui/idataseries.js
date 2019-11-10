 (function() {

    function IDataSeries(enumerable) {
        this.data = enumerable || [];
        Object.defineProperties(this, {
            "length": { get: function() { return this.data.length; } },
        });
    }

	IDataSeries.prototype.getRange = function(seriesId, start, length, data) {
        var info = { count:0, max:start };
        var end = start + length;
        if (this.data && this.data[seriesId] != undefined) {
            for (var i=start; i<end; i++) {
                var value = this.get(seriesId, i);
                if (value != undefined) {
                    data.push(...value);
                    info.count++;
                    info.max = i;
                }
            }
        }
        return info;
    };
	IDataSeries.prototype.get = function(seriesId, ix) {
        this.data[seriesId][ix];
    };
	IDataSeries.prototype.set = function(seriesId, ix, value) {
        if (this.data[seriesId] == undefined) {
            this.data[seriesId] = [];
        }
        this.data[seriesId][ix] = value;
    };
    IDataSeries.prototype.push = function(seriesId, value) {
        if (this.data[seriesId] == undefined) {
            this.data[seriesId] = [];
        }
        this.set(seriesId, this.data[seriesId].length, value);
    };
	IDataSeries.prototype.add = function(index, chnId) { throw new Error('Not implemented!'); };
	IDataSeries.prototype.remove = function(index, chnId) { throw new Error('Not implemented!'); };

    public(IDataSeries, 'IDataSeries');
})();