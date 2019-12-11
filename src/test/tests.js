// include('frmwrk/fw.js');
include('utils/logger.js');
include('ui/datalink.js')
include('/ui/textbox.js');
include('/ui/slider.js');
include('/ui/ddlist.js');
include('/ui/checkbox.js');
include('/ui/button.js');
include('/ui/board.js');
include('/ui/grid.js');

// include('ge/synth.js');
// include('ge/player.js');
// include('ge/synthAdapter.js');
// include('ge/sound.js');

//if (typeof onpageload === 'function') window.onload = onpageload;

var g_logger = null;

function test(rs, onload, onerror) {
    var data = load(rs, onload, onerror);
    if (data instanceof Error) {
        g_logger.error('Loading ' + rs + ' failed!<hr/>');
    } else {
        if (typeof onload !== 'function') {
            g_logger.info('Loading ' + rs + ' passed!<small><pre style="font-size:7pt;background-color:silver">' + data + '</pre></small>');
        }
    }
}

async function loadTest(content) {

    g_logger.info('Load test'); g_logger.hr();

    //test('deploy.lst');
    // var img = load('test.gif');
    // document.body.appendChild(img);

    var data = null;
    data = await load('deploy.lst')
    g_logger.info(data);
    data = await load('deploy.lsst')
    g_logger.info(data);

    load('deploy.lst').then(data => {
        g_logger.info(data);
    });
    load('deploy.lsst').then(data => {
        g_logger.info(data);
    });

    data = await load(['deploy.lsst', 'test.gif'])
    g_logger.info(data); g_logger.hr();

    load(['deploy.lst', 'test.gif']).then(data => {
        g_logger.info(data); g_logger.hr();
    });
    load(['deploy.lsst', 'test.gif']).then(data => {
        g_logger.info(data); g_logger.hr();
    });
}

function requireTest(content) {
    var dummy = require('./dummy.js');
    dummy.func1();

}

function arrayTest(content) {
    var arr = new fw.Array();
    arr.push('alma');
    arr.push('szilva');
    g_logger.info('arr.class = ' + arr.getClass());
}

function loggerTest() {
    for (var i=0; i<Log.levels.length; i++) {
        g_logger.setLevel(i);
        g_logger.trace(i + ' log test');
        g_logger.debug(i + ' log test');
        g_logger.info(i + ' log test');
        g_logger.warn(i + ' log test');
        g_logger.error(i + ' log test');
    }
}

function parseElementTest() {
    var cfg = load({url: 'app.cfg', contentType: 'text/xml' });
    g_logger.info('app.name: ' + cfg.app.name);
    g_logger.info('app.title: ' + cfg.app.title);
    g_logger.info('debug is ' + (cfg.app.debug=='0' ? 'off' : 'on'));
}

function hash(i) {
    var j = 0;
    if (i > 0) {
        j = (i+1)>>1;
    }
    k = j*j; 
    return i%2 == 0 ? k : -k;
}

function hashTest() {
    var n = 65539; // 4k+3 -> prime
    var m = [];
    for (var i=0; i<n; i++) {
        m.push(0);
    }
    var collisions = [];
    for (var i=0; i<n; i++) {
        var k = hash(i, n) % n;
        if (k < 0) k += n;
        //g_logger.info(k);
        m[k]++;
        if (m[k] > 1) {
            if (collisions.indexOf(k) == -1) {
                collisions.push(k);
            }
        }
    }
    if (collisions.length > 0) {
        collisions.forEach( k => {
            g_logger.info('Fail at ' + k);
        });
    } else {
        g_logger.info('No collisions!');
    }
}

function urlInfoTest() {
    var url = 'https://max:muster@www.example.com:8080/users/ng210/index.html?k1=v&k2=v2&k3#resource';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    url = 'https://www.example.com/users/ng210/index.html?k1=v&k2=v2&k3';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    url = 'https://www.example.com/users/ng210/index.html';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    url = 'https://www.example.com/users/ng210';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    url = 'www.example.com/users/ng210';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    url = '/users/ng210/index.html?k1=v&k2=v2&k3#ressource';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    url = '../index.html?k1=v&k2=v2&k3#ressource';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
}

function normalizePathTest() {
    var path = 'dirA/dirB/file.ext';
    g_logger.info(path + ' => ' + load.normalizePath(path));
    path = '../dirA/dirB/file.ext';
    g_logger.info(path + ' => ' + load.normalizePath(path));
    path = '/dirA/dirB/file.ext';
    g_logger.info(path + ' => ' + load.normalizePath(path));
    path = '../dirA/../dirB/file.ext';
    g_logger.info(path + ' => ' + load.normalizePath(path));
    path = 'dirA//dirB/file.ext';
    g_logger.info(path + ' => ' + load.normalizePath(path));
}

function synthTest() {
    var ns_synth = require('/ge/synth.js');
    var ns_player = require('/ge/player.js');
    var SynthAdapter = require('/ge/synthAdapter.js');
    var sound = require('/ge/sound.js');

	var player = new ns_player.Player();
	var mainSeq = [
		new ns_player.Command(   0, ns_player.Cmd_setTempo, [16, 4]),			// set fps to 5, tpf to 1 (makes 5 tps)
		new ns_player.Command(   0, ns_player.Cmd_assign, [0, 1, 1 | 2]),		// connect target #0 with sequence #1 with status active
		new ns_player.Command(1000, ns_player.Cmd_end, null)					// end
	];
	var subSeq1 = [
		new ns_player.Command(   0, SynthAdapter.Cmd_setNote, [12, 0.7]),	//C
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.7]),	//E
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [12, 0.7]),	//C
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.7]),	//E
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [19, 0.7]),	//G
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [19, 0.0]),
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [19, 0.7]),	//G
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [19, 0.0]),
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [12, 0.7]),	//C
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.7]),	//E
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [12, 0.7]),	//C
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.7]),	//E
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [19, 0.7]),	//G
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [19, 0.0]),
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [19, 0.7]),	//G
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [19, 0.0]),
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [24, 0.7]),	//C
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [24, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [23, 0.7]),	//H
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [23, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [21, 0.7]),	//A
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [21, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [19, 0.7]),	//G
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [19, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [17, 0.7]),	//F
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [17, 0.0]),
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [21, 0.7]),	//A
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [21, 0.0]),
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [19, 0.7]),	//G
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [19, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [17, 0.7]),	//F
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [17, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.7]),	//E
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [14, 0.7]),	//D
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [14, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [12, 0.7]),	//C
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [12, 0.7]),	//C
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(  16, ns_player.Cmd_end, null)
	];
	// the very first sequence is the master that spawns all the channels
	player.addSequence(mainSeq);
	player.addSequence(subSeq1);
	// add synth
	var synth = new ns_synth.Synth(48000);
	synth.setup([
		ns_synth.Ctrl.amp, 0.6,
		ns_synth.Ctrl.Lfo1fre, 5.1,     ns_synth.Ctrl.Lfo1amp, 0.2,	ns_synth.Ctrl.Lfo1wav, ns_synth.WF_SIN,
		ns_synth.Ctrl.Lfo2fre, 7.0,     ns_synth.Ctrl.Lfo2amp, 4.0,	ns_synth.Ctrl.Lfo2wav, ns_synth.WF_SIN,

		ns_synth.Ctrl.Env1atk, 0.01,    ns_synth.Ctrl.Env1dec, 0.01,
		ns_synth.Ctrl.Env1sus, 0.2,     ns_synth.Ctrl.Env1rel, 0.5,
		ns_synth.Ctrl.Env1off, 0.0,     ns_synth.Ctrl.Env1amp, 1.0,

		// ns_synth.Ctrl.Env2atk, 0.0,	ns_synth.Ctrl.Env2dec, 0.05, 
		// ns_synth.Ctrl.Env2sus, 0.5,	ns_synth.Ctrl.Env2rel, 0.5,
		// ns_synth.Ctrl.Env2off, 1.0,	ns_synth.Ctrl.Env2amp, 1.0, 

		ns_synth.Ctrl.Osc1wav, ns_synth.WF_TRI,
		ns_synth.Ctrl.Osc1fre, 0.0,	ns_synth.Ctrl.Osc1amp, 0.6,	ns_synth.Ctrl.Osc1psw, 0.6,
		ns_synth.Ctrl.Osc1tun, 12.0, 
		ns_synth.Ctrl.Osc2wav, ns_synth.WF_TRI,
		ns_synth.Ctrl.Osc2fre, 1.1,	ns_synth.Ctrl.Osc2amp, 0.4,	ns_synth.Ctrl.Osc2psw, 0.3,
		ns_synth.Ctrl.Osc2tun, 24
    ]);
	// add synth adapter
	player.addTarget(synth, new SynthAdapter());

    var frameCounter = 0;
	sound.init(48000, function(buffer, bufferSize) {
        var samplesPerFrame = 48000 / player.refreshRate;
        var start = 0;
        var end = 0;
        var remains = bufferSize;
        while (remains) {
            if (frameCounter == 0) {
                player.run(1);
                frameCounter = samplesPerFrame;
            }
            var len = frameCounter < remains ? frameCounter : remains;
            end = start + len;
            frameCounter -= len;
            synth.run(buffer, start, end);
            start = end;
            remains -= len;
        }
    });

}

function isChild(container, ctrl) {
    var node = ctrl;
    var result = false;
    while (node) {
        if (node == container) {
            result = true;
            break;
        }
        node = node.parent;
    }
    return result;
}

function onEvent(e) {
    var el = e.target;
    if (e.type === 'mouseover' || e.type === 'mouseout') {

    }
}

var focusTarget = null;
function uiTest() {
    document.body.addEventListener('mouseover', function(e) {
        focusTarget = e.target;
        e.target.style.border = 'solid 1px blue';
        console.log(`FOCUS on ${focusTarget.id} (${focusTarget.tagName}) - ${this.id} (${this.tagName})`);
    });
    document.body.addEventListener('mouseout', function(e) {
        //focusTarget = e.target;
        e.target.style.border = 'none 1px blue';
        console.log(`BLUR on ${focusTarget.id} (${focusTarget.tagName}) - ${this.id} (${this.tagName})`);
        // if (!isChild(focusTarget, e.target)) {
        //     console.log(`BLUR on ${focusTarget.id} (${focusTarget.tagName})`);
        // }
    });

    document.querySelector('#content').addEventListener('mouseover', function(e) {
        focusTarget = e.target;
        e.target.style.border = 'solid 1px blue';
        console.log(`FOCUS on ${focusTarget.id} (${focusTarget.tagName}) - ${this.id} (${this.tagName})`);
    });
    document.querySelector('#content').addEventListener('mouseout', function(e) {
        //focusTarget = e.target;
        e.target.style.border = 'none 1px blue';
        console.log(`BLUR on ${focusTarget.id} (${focusTarget.tagName}) - ${this.id} (${this.tagName})`);
    });


    // document.querySelector('#content').addEventListener('mouseover', function(e) {
    //     this.style.border = 'solid 2px blue';
    //     console.log(`${e.type} (${e.bubbles}) ${e.target.id} - ${this.id}`);
    // });
    // document.querySelector('#embed').addEventListener('mouseover', function(e) {
    //     //if (this == e.target) {
    //         this.style.border = 'solid 2px blue';
    //         console.log(`${e.type} (${e.bubbles}) ${e.target.id} - ${this.id}`);
    //     //}
    // }, true);
    // document.querySelector('#content').addEventListener('mouseout', function(e) {
    //     //if (this == e.target) {
    //         this.style.border = 'none 2px blue';
    //         console.log(`${e.type} (${e.bubbles}) ${e.target.id} - ${this.id}`);
    //     //}
    // });
    // document.querySelector('#embed').addEventListener('mouseout', function(e) {
    //     //if (this == e.target) {
    //         this.style.border = 'none';
    //         console.log(`${e.type} (${e.bubbles}) ${e.target.id} - ${this.id}`);
    //     //}
    // }, true);


    // var obj = {
    //     "family": {
    //         "father": { "age": 40, "name": "Gabor", "color": "blue", "health": 0.7, "married": true, "confirm": "Ok" },
    //         "mother": { "name": "Tilda", "color": "red", "health": 0.8, "married": true, "confirm": "Go" },
    //         "child": { "age": 10, "name": "Gergely", "color": "green", "health": 0.9, "married": false, "confirm": "Da me!" }
    //     }
    // };

    // var template = {
    //     "type": "grid",
    //     "data-field": "family",
    //     "row-template": {
    //         "name": {
    //             "type":"textbox", "data-field":"name", "data-type":"string", "label": "$Key",
    //             "events": ["change"]
    //         },
    //         "age": {
    //             "type":"textbox", "data-field":"age", "data-type":"int", "label": true,
    //             "min": "1", "max": "100", "step": "1",
    //             "events": ["change"]
    //         },
    //         "color": {
    //             "type":"ddlist", "data-field":"color", "data-type":"string", "label": "$Key",
    //             "items":["red", "green", "blue"], "events": ["change"]
    //         },
    //         "health": {
    //             "type":"slider", "data-field":"health", "data-type":"float", "label": "$key",
    //             "min": 0.0, "max": 1.0, "step": 0.1,
    //             "events": ["change"]
    //         },
    //         "married": {
    //             "type":"checkbox", "data-field":"married", "label": "Trapped",
    //             "events": ["change"]
    //         },
    //         "accept": {
    //             "type":"button", "data-field":"confirm", "label": "Accept values",
    //             "events": ["click"]
    //         }
    //     }
    // };

    // var grid = Ui.Control.create('family', template);
    // grid.dataBind(obj, 'family');
    // grid.render({node:document.body});
}

function onpageload(errors) {
    if (errors.length > 0) {
        alert('Error during loading: ' + errors.map(err => err.message).join('\n'));
    }

    var content = document.getElementById('content');
    g_logger = new Log({
        format: '{{color}}<small><b>{{level}}</b> - <i>{{file}}::{{method}}</i>({{line}})</small>{{color}} - ' +
                '<tt>{{message}}</tt></br>',
                //'<div style="font-size: large; background-color: silver; margin: 0px; padding: 0px"><tt>{{message}}</tt></div>',
        level: 'info',
        print: {
            context: null,
            method: function(data) {
                content.innerHTML += data;
            }
        }
    });

    //loadTest(content);

    uiTest();

    // urlInfoTest();

    // requireTest(content);

    // arrayTest(content);

    // loggerTest(content);

    // parseElementTest(content);

    // hashTest();

    // normalizePathTest();

    // synthTest();
}

