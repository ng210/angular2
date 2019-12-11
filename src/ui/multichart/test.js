include('/ui/multichart.js');
include('/synth/notechart.js');
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
            'unit': [20,18],
            'titlebar': 'Test1'
        };
        var multiChart = new Ui.MultiChart('test1', config, null);
        multiChart.dataBind(dataSeries);
        multiChart.selectedChannelId = 'ints';
        multiChart.template.width = 960;
        ctrls_.push(multiChart);

        dataSeries = new TestDataSeries.SimpleSeries();
        config = {
            'titlebar': 'Test2',
            'height': 240
        };
        multiChart = new Ui.MultiChart('test2', config, null);
        multiChart.dataBind(dataSeries);
        multiChart.selectedChannelId = 0;
        ctrls_.push(multiChart);
        //multiChart.onclick = function(ctrl) { ctrl.isRunning = false; isDone_ = true; };

        dataSeries = new TestDataSeries.ComplexSeries();
        config = {
            'titlebar': 'Test3',
            'height': 240
        };
        multiChart = new Ui.MultiChart('test3', config, null);
        multiChart.dataBind(dataSeries);
        multiChart.selectedChannelId = 'notes';
        ctrls_.push(multiChart);

        for (var i=0; i<ctrls_.length; i++) {
            await ctrls_[i].render({'element': document.body});
        }
        ctrls_[0].scroll(0, 0);
        return new Promise(resolve => poll(resolve) );
    }

    function poll(resolve) {
        clearTimeout(pollTimer_);
        if (!isDone_) {
            //ctrls_[1].scroll(0.1, 0);
            pollTimer_ = setTimeout(poll, 250, resolve);
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