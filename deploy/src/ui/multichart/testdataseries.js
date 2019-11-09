include('/ui/idataseries.js');
(function() {

    function TestDataSeries(data) {
        IDataSeries.call(this, data);

        this.constructor = TestDataSeries;
    }
    TestDataSeries.prototype = new IDataSeries;

    public(TestDataSeries, 'TestDataSeries');
})();
