include('/ui/multichart.js');
include('/ui/multichart/testdataseries.js');

(function() {

    var ctrls_ = [];
    var isDone_ = false;
    var pollTimer_ = null;

    async function test_multichart() {
        var dataSeries = new TestDataSeries.SimpleSeries();
        var config1 = {
            'width': 720,
            'height': 360,
            'grid-color': [0.2, 0.4, 0.6],
            'unit': [20, 15],
            'titlebar': 'Test1'
        };
        ctrls_.push(new Ui.MultiChart('test1', config1, null));
        ctrls_.push(new Ui.MultiChart('test2', { titlebar: 'Test2' }, null, '/ui/multichart/shaders/default'));
        //ctrls_[0].onclick = e => { ctrls_[0].isRunning = false; isDone_ = true; };
        ctrls_[0].dataBind(dataSeries);
        ctrls_[0].selectedChannelId = 0;
        ctrls_[1].dataBind(dataSeries);
        ctrls_[1].selectedChannelId = 1;

        for (var i=0; i<ctrls_.length; i++) {
            await ctrls_[i].render({'element': document.body});
        }
        ctrls_[0].element.style.width = '720px';
        ctrls_[1].element.style.width = '300px';
        return new Promise(resolve => poll(resolve) );
    }

    function poll(resolve) {
        clearTimeout(pollTimer_);
        if (!isDone_) {
            pollTimer_ = setTimeout(poll, 100, resolve);
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