 (function() {

    function IDataSeries(enumerable) {
        this.data = enumerable || [];
    }

	IDataSeries.prototype.getLength = () => data.length;
	IDataSeries.prototype.get = function(ix, seriesId) {
        return this.data && this.data[seriesId] != undefined ? this.data[seriesId][ix] : undefined;
    };
	IDataSeries.prototype.set = function(ix, seriesId, value) {
        if (this.data[seriesId] == undefined) {
            this.data[seriesId] = [];
        }
        this.data[seriesId][ix] = value;
    };
	IDataSeries.prototype.add = function(index, chnId) { throw new Error('Not implemented!'); };
	IDataSeries.prototype.remove = function(index, chnId) { throw new Error('Not implemented!'); };

    public(IDataSeries, 'IDataSeries');
})();