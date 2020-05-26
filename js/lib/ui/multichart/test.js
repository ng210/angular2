include('ui/multichart.js');
include('data/dataseries.js');

(function() {

    var ctrls_ = [];
    var isDone_ = false;
    var pollTimer_ = null;

    var MultiDataSeries = {
        'ints': (function() {
            var ds = new DataSeries();
            for (var i=0; i<10; i++) {
                ds.set([2*i, Math.floor(0.4*i*i)]);
            }
            //ds.isStrict = true;
            return ds;
        })(),
        'floats': (function() {
            var ds = new DataSeries();
            for (var i=0; i<20; i++) {
                ds.set([i, i]);
            }
            return  ds;
        })(),
        'notes': (function() {
            var ds = new DataSeries();
            var pitch = 0;
            var step = 1;
            var frame = 0;
            while (frame < 60) {
                ds.set([frame, pitch, Math.floor(63 + 192*frame/60), step]);
                pitch += 2;
                frame += step;
                step *= 2;
            }
            return  ds;
        })(),
    };

    async function test_multichart() {
        var template = {
            'width': 320,
            'height': 240,
            'unit': [32, 24],
            'grid-color': [0.2, 0.4, 0.6],
            'titlebar': 'Test1',
            'line-width': 0.1
        };
        var multiChart = new Ui.MultiChart('test1', template, null);
        multiChart.dataBind(MultiDataSeries);
        multiChart.selectChannel('ints');
        ctrls_.push(multiChart);

        template = {
            'titlebar': 'Test2',
            'height': 240,
            'unit': [30, 24],
            'render-mode': 'bar'
        };
        multiChart = new Ui.MultiChart('test2', template, null);
        multiChart.dataBind(MultiDataSeries);
        multiChart.selectChannel('ints');
        ctrls_.push(multiChart);

        template = {
            'titlebar': 'Test3',
            'height': 200,
            'unit': [30, 20],
            'render-mode': 'dot'
        };
        multiChart = new Ui.MultiChart('test3', template, null);
        multiChart.dataBind(MultiDataSeries);
        multiChart.selectChannel('ints');
        ctrls_.push(multiChart);

        template = {
            'titlebar': 'Test4',
            'height': 240,
            'unit': [30, 24],
            'render-mode': 'line'
        };
        multiChart = new Ui.MultiChart('test4', template, null);
        multiChart.dataBind(MultiDataSeries);
        multiChart.selectChannel('ints');
        ctrls_.push(multiChart);

        template = {
            'titlebar': 'Test5',
            'height': 200,
            'unit': [30, 20],
            'render-mode': 'area'
        };
        multiChart = new Ui.MultiChart('test5', template, null);
        multiChart.dataBind(MultiDataSeries);
        multiChart.selectChannel('ints');
        ctrls_.push(multiChart);

        template = {
            'titlebar': 'Test6',
            'height': 240,
            'unit': [20, 16],
            'render-mode': 'line2'
        };
        multiChart = new Ui.MultiChart('test6', template, null);
        multiChart.dataBind(MultiDataSeries);
        multiChart.selectChannel('ints');
        ctrls_.push(multiChart);

        template = {
            'titlebar': 'Test7',
            'width': 400,
            'height': 240,
            'unit': [20, 16],
            'render-mode': 'bar2'
        };
        multiChart = new Ui.MultiChart('test7', template, null);
        multiChart.dataBind(MultiDataSeries);
        multiChart.selectChannel('notes');
        ctrls_.push(multiChart);
        multiChart.onSet = function(from, to) {
            var dx = Math.abs(to[0] - from[0]) + 1;
            var dy = Math.abs(to[1] - from[1]) + 1;
            var velocity = Math.floor(255 * dy * this.uniforms.uUnit.value[1]/this.uniforms.uSize.value[1]);
            var note = [from[0], from[1], velocity, dx];
            this.series.set(note);
            console.log('custom: [' + note +']');
        };

        for (var i=0; i<ctrls_.length; i++) {
            await ctrls_[i].render({'element': document.body});
        }
        //ctrls_[0].scroll(30, 0);

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