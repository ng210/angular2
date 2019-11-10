include('/ui/idataseries.js');
(function() {

    function TestDataSeries(data) {
        IDataSeries.call(this, data);

        this.constructor = TestDataSeries;
    }
    TestDataSeries.prototype = new IDataSeries;

	TestDataSeries.prototype.get = function(seriesId, ix) {
        return this.data && this.data[seriesId] && this.data[seriesId][ix] != undefined ? this.data[seriesId][ix].x : undefined;
    };
	TestDataSeries.prototype.set = function(seriesId, ix, value) {
        if (this.data[seriesId] == undefined) {
            this.data[seriesId] = [];
        }
        this.data[seriesId][ix] = { x: value };
    };

    public(TestDataSeries, 'TestDataSeries');
})();
