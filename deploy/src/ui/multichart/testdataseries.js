include('/ui/idataseries.js');
(function() {

    function TestDataSeries(data) {
        IDataSeries.call(this, data);

        this.constructor = TestDataSeries;
    }
    TestDataSeries.prototype = new IDataSeries;

	TestDataSeries.prototype.get = function(seriesId, ix) {
        return [ix, this.data[seriesId][ix]];
    };

	TestDataSeries.prototype.set = function(seriesId, ix, value) {
        if (this.data[seriesId] == undefined) {
            this.data[seriesId] = [];
        }
        this.data[seriesId][ix] = value;
    };

    public(TestDataSeries, 'TestDataSeries');
})();
