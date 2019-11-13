include('/ui/multichart.js');
include('/ui/multichart/testdataseries.js');

(function() {

    var ctrls_ = [];
    var isDone_ = false;
    var pollTimer_ = null;

    async function test_multichart() {
        var dataSeries = new TestDataSeries.ComplexSeries();
        var config = {
            'width': 720,
            'height': 360,
            'grid-color': [0.2, 0.4, 0.6],
            'unit': [20, 16],
            'titlebar': 'Test1'
        };
        var multiChart = new Ui.MultiChart('test1', config, null);
        multiChart.dataBind(dataSeries);
        multiChart.selectedChannelId = 'ints';
        ctrls_.push(multiChart);

        dataSeries = new TestDataSeries.SimpleSeries();
        config = {
            'titlebar': 'Test2'
        };
        multiChart = new Ui.MultiChart('test2', config, null);
        multiChart.dataBind(dataSeries);
        multiChart.selectedChannelId = 0;
        ctrls_.push(multiChart);
        //multiChart.onclick = function(ctrl) { ctrl.isRunning = false; isDone_ = true; };

        for (var i=0; i<ctrls_.length; i++) {
            await ctrls_[i].render({'element': document.body});
            break;
        }
        ctrls_[0].element.style.width = '720px';
        //ctrls_[1].element.style.width = '300px';
        return new Promise(resolve => poll(resolve) );
    }

    function poll(resolve) {
        clearTimeout(pollTimer_);
        if (!isDone_) {
            pollTimer_ = setTimeout(poll, 1000, resolve);
        } else {
            resolve();
        }
    }

    var tests = async function() {
        await test_multichart();
        return 0;
    };
    public(tests, 'UI tests');
})();