include('/base/dbg.js');

include('grammar.js');
include('/utils/syntax.js');

include('/synth/synth.js');

include('/ge/player/player-lib.js');
include('/ge/player/player-ext.js');
include('/synth/synth-adapter.js');
include('./synth-adapter-ext.js');

include('ui/notechart.js');
include('ui/synth-ui.js');

var _app = {
    "ui": null,
    "menu": null,

    "settings": {
        "adapter-config": { "key": "Adapter config", "value": "res/adapters.json", "help": "Url to the adapter configuration JSON file" },
        "sampling-rate": { "key": "Sampling rate", "value": "48000", "help": "Sampling rate for sound playback" }
    },

    "adapters": {},
    //"devices": [],
    "sequences": [],
    "dataBlocks": {},

    "player": null,
    "masterSequence": null,
    "masterChannel": null,

    "dialogs": {
        "settings": null,
        "new": null,
        "about": null
    },
    "views": {
        "devices": null,
        "sequences": null
    },
    "selection": {
        "device": null,
        "sequence": null
    },

    initialize: async function() {
        // load and create dialogs
        var map = {};
        var urls = [];
        for (var key in this.dialogs) {
            var url = `dialog/${key}-dlg.js`;
            urls.push(url);
            map[url] = key;
            urls.push(`dialog/${key}-dlg.css`);
        }
        var mdls = await load(urls);
        for (var i=0; i<mdls.length; i++) {
            var mdl = mdls[i];
            var key = map[mdl.url];
            if (mdl instanceof Module) {
                this.dialogs[key] = new mdl.symbols.Constructor(this);
                Dbg.prln(`Dialog '${key}' loaded.`);
            }        
        }

        await this.loadAdapters();

        this.createNew();
    },

    loadAdapters: async function() {
        var res = await load(this.settings['adapter-config'].value);
        if (res.error instanceof Error) {
            Dbg.prln(`Could not load '${res.resolvedUrl}'`);
        } else {
            var urls = [];
            for (var i in res.data) {
                if (res.data.hasOwnProperty(i)) {
                    res.name = i;
                    var url = new Url(res.data[i]);
                    urls.push(url.normalize());
                }
            }
            res = await load(urls);
            for (var i=0; i<res.length; i++) {
                if (!res[i].error) {
                    for (var j in res[i].symbols) {
                        var symbol = res[i].symbols[j];
                        if (typeof symbol === 'function' && symbol.prototype instanceof Ps.IAdapter) {
                            if (!this.adapters[j]) {
                                this.adapters[j] = Reflect.construct(symbol, []);
                                Dbg.prln(`Adapter '${j}' loaded`);
                            }
                        }
                    }                    
                }
            }
        }
    },

    createNew: function() {
        // create player
        this.player = this.createDevice({adapter:'Player', id:'Master', type:Ps.Player.Device.PLAYER, data:null});
        // create master sequence
        this.masterSequence = this.createSequence({adapter:'Player', id:'Master'});
        // create master channel
        this.masterChannel = this.adapters.Player.createDevice(Ps.Player.Device.CHANNEL, null);
    },

    createUi: async function() {
        this.ui = new Ui.Board('app', { titlebar: false, layout: 'vertical' }, this);
    
        // create menu
        var template = await include('res/main-menu.json')
        this.menu = new Ui.Menu('mainMenu', template.data, this.ui);
        this.ui.add('menu', this.menu);

        // create main panel
        this.ui.addNew('ui', {
            type: 'panel', titlebar: false, layout:'horizontal', css: 'main', split: [512], fixed: true,
            items: {
                'devices': { type: 'board', titlebar: false, layout: 'vertical' },
                'sequences': { type: 'board', titlebar: false, layout: 'vertical', /*split: [30, 50, 20]*/ }
            }
        });
        this.views.devices = this.ui.items.ui.items.devices;
        this.views.sequences = this.ui.items.ui.items.sequences;
        this.ui.render({element:document.body});
    },

    createDevice: async function(info) {
        // create device
        var adapter = this.adapters[info.adapter];
        var device = adapter.createDevice(parseInt(info.type), info.data);
        device.id = info.id;
        // create Ui
        var ui = adapter.createDeviceUi(device);
        device.ui = ui;
        ui.device = device;
        this.views.devices.add(device.id, ui);
        await this.views.devices.renderItems();
        ui.titleBar.onclick = e => this.onSelectDevice(e);
        ui.render();
        return device;
    },

    createSequence: async function(info) {
        var adapter = this.adapters[info.adapter];
        var sequence = new Ps.Sequence(adapter);
        sequence.id = info.id;
        var ui = adapter.createSequenceUi(sequence);
        ui.title = info.id;
        this.views.sequences.add(sequence.id, ui);
        await this.views.sequences.renderItems();
        ui.toolbar.onclick = e => this.onSelectSequence(e);
        debugger
        ui.render();
        return sequence;
    },
    createChannel: function(device, sequence) {
        // create channel
        var channel = new Ps.Channel(`channel${('00'+si).slice(-2)}`, this.player);
        channel.loopCount = 0;
        channel.assign(device, sequence);
    },
    // event handlers
    onDialog: function(dlg, result) {
        if (result) {
            switch (dlg.id) {
                case "AboutDialog":
                    break;
                case "SettingsDialog":
                    console.log(JSON.stringify(this.settings));
                    break;
                case "NewDialog":
                    switch (result.mode) {
                        case 'device': this.createDevice(result); break;
                        case 'sequence': this.createSequence(result); break;
                        default: console.log(JSON.stringify(result)); break;
                    }
                    
                    break;
            }
        }
    },
    onMenuSelect: function(path) {
        if (path[0] == 'mainMenu') {
            switch (path[1]) {
                case 'file':
                    switch (path[2]) {
                        case 'new':
                            this.dialogs.new.open(this, path[3]);
                            break;
                        // ...
                        case 'settings': this.dialogs.settings.open(this); break;
                    }
                    break;
                case 'help':
                    switch (path[2]) {
                        case 'about': this.dialogs.about.open(this); break;
                    }
                    break;
            }
        }
    },
    // onclick: function(e) {
    //     debugger;
    // },
    onSelectDevice: function(e) {
        var control = e.control.parent;
        if (this.selection.device) {
            this.selection.device.removeClass('selected', true);
        }
        this.selection.device = control;
        control.addClass('selected', true);
    },
    onSelectSequence: function(e) {
debugger
        var control = e.control.parent;
        if (this.selection.sequence) {
            this.selection.sequence.removeClass('selected', true);
        }
        this.selection.sequence = control;
        control.addClass('selected', true);
    }

};

// var _ui = null;
// var _synths = [];
// var _series = null;
// var _player = null;
// var _selected = 0;
// var _frame = 0;
// var _samplePerFrame = 0;
// var _menu = null;
// var _settings = {
//     'isRunning': true,
//     'bpm': 60,
//     'samplingRate': 48000
// };

/*****************************************************************************/
async function createSequences(path) {
    var res = await load(path);
    if (res.error instanceof Error) {
        throw res.error;
    }
    var sequences = [];
    var syntax = new Syntax(_grammar, false);
    var lines = res.data.split('\n');
    var i=0;
    while (i<lines.length) {
        var sequence = new Ps.Sequence(psynth.SynthAdapter);
        while (i<lines.length) {
            var line = lines[i++];
            if (line.search(/^\s*\/\/|^\s*$/) == -1) {
                var expr = syntax.parse(line);
                if (expr.resolve().evaluate(sequence)) {
                    sequences.push(sequence);
                    break;
                }
            }
        }
    }
    Dbg.prln(`${sequences.length} sequences loaded.`);
    return sequences;
}
async function loadSequence(url) {
    _series = [];
    var sequences = await createSequences('res/demo01.seq');
    for (var i=0; i<sequences.length; i++) {
        _player.sequences.push(sequences[i]);
        _series.push(psynth.SynthAdapter.toDataSeries(sequences[i]));
    }
    return _series;
}
function deviceMenu(key) {
    if (key == 'new') {
        // dialog...
        createSynth(3);
        _menu.items.device.render();
        _ui.items.modules.render();
    } else {
        var ix = 0;
        for (var i in _ui.items.modules.items) {
            var item = _ui.items.modules.items[i];
            if (item.id == key) {
                selectChannel(ix);
            }
            ix++;
        }        
    }
}

function createPlaybackControls() {
    var playback = new Ui.Board(
        'PlaybackToolBar',
        {
            'titlebar': false,
            items: {
                'bpm': { type:'pot', label:'Bpm', min: 60, max: 160, step: 1, digits: 3, 'data-field': 'bpm', css:'main controls pot', events:['dragging'] },
            }
        }
    );
    var playbackControls = { rewind: 0x37, play: 0x34, stop: 0x3c, forward: 0x38 };
    for (var i in playbackControls) {
        playback.addNew(i, { type:'label', value: String.fromCharCode(playbackControls[i]) });
    }
    playback.items.bpm.ondragging = function(e) { updateBpm(); };
    playback.render({element:document.getElementById('controls')});
    return playback;
}

function createSynth(voiceCount, patternId) {
    // create synth
    //var synth = new psynth.Synth(_settings.samplingRate, 3);
    psynth.SynthAdapter.addTargets(_player.targets, new Uint8Array([1, psynth.SynthAdapter.Device.SYNTH, voiceCount]));
    var synth = _player.targets[_player.targets.length-1];
    var si = _synths.length;

    _synths.push(synth);
    // create synth ui
    var id = `synth${('0' + (si+1)).slice(-2)}`;
    var synthUi = new Ui.Synth(id);
    synthUi.addClass('synth');
    synthUi.dataBind(synth);
    _ui.items.modules.add(id, synthUi);
    synthUi.render();
    synthUi.changePreset(synthUi.preset);
    synthUi.titleBar.onclick = onSelectChannel;
    
    // create channel
    var channel = new Ps.Channel(`channel${si}`, _player);
    channel.loopCount = 0;
    if (patternId != undefined && patternId != -1 && patternId < _player.sequences.length) {
        channel.assign(_player.targets[si], _player.sequences[patternId]);
    }    
    _player.channels.push(channel);
    // _menu.items.device.addItem(id);
    // _menu.items.device.render();

    return synthUi;
}
function createEditor(isNote) {
    var template = {
        'width': 1200,
        'height': 600,
        'unit': [32, 24],
        'grid-color': [0.2, 0.4, 0.6],
        'titlebar': '',
        'line-width': 0.1,
        'path': '/synth/ui'
    };
    var id = `ed${('0'+_ui.items.editors.count()).slice(-2)}`;
    var editor = isNote ? new Ui.NoteChart(id, template, null) : new Ui.MultiChart(id, template, null);
    editor.onSet = multiChartOnSet;
    editor.onRemove = multiChartOnRemove;

    _ui.items.editors.add(id, editor);
    return editor;
}
function multiChartOnSet(from, to) {
    //this.__proto__.onSet.call(this, from, to);
    //console.log('onset: ' + [from, to]);
    var dx = Math.abs(to[0] - from[0]) + 1;
    var dy = Math.abs(to[1] - from[1]) + 1;
    var velocity = 60;  //Math.floor(255 * dy * this.uniforms.uUnit.value[1]/this.uniforms.uSize.value[1]);
    var note = [from[0], from[1], velocity, dx];
    this.series.set(note);
    //console.log('custom: [' + note +']');

    // this.pattern.sequence.stream = psynth.SynthAdapter.fromDataSeries(this.dataSource).stream;
    // this.updateDataPoints(from, to);
}
function multiChartOnRemove(from, to) {
    this.__proto__.onRemove.call(this, from, to);
    console.log('onremove: ' + [from, to]);
    // resetPlayer();
    // this.pattern.sequence.stream = psynth.SynthAdapter.fromDataSeries(this.dataSource).stream;
    // this.updateDataPoints(from, to);

}

/*****************************************************************************/
function updateBpm() {
    // bpm 4th per minute => bpm*8/60 8th per second = bpm/7.5
    _samplePerFrame = Math.floor(_settings.samplingRate*7.5/_settings.bpm);
}

function selectChannel(ix) {
    _ui.items.modules.item(_selected).removeClass('selected', true);
    _selected = ix;
    _ui.items.modules.item(ix).addClass('selected', true);

    var editor = _ui.items.editors.items.ed00;
    if (_player.channels[ix].sequence != null) {
        editor.dataBind(_series[ix]);
        editor.selectChannel(psynth.SynthAdapter.SETNOTE);
        editor.updateDataPoints();
    }
}

/*****************************************************************************/
// async function initializePlayer() {
//     _player = new Ps.Player();
//     // add adapter singletons
//     _player.addAdapter(psynth.SynthAdapter);
//     psynth.SynthAdapter.prepareContext({
//         samplingRate: _settings.samplingRate,
//         callback: fillSoundBuffer
//     });
// }
// function resetPlayer() {
//     for (var i=0; i<_player.channels.length; i++) {
//         _player.channels[i].loopCount = 1;
//         _player.channels[i].reset();
//         _player.channels[i].isActive = true;
//     }
// }
function update() {
    var isRunning = false;
    for (var i=0; i<_player.channels.length; i++) {
        var isActive = _player.channels[i].run(1);
        //console.log(`Chn #${i} is ${isActive ? 'active' : 'inactive'}`);
        isRunning = isRunning || isActive;
        //console.log(`Playback is ${isRunning ? 'running' : 'stopped'}`);        
    }
    if (!isRunning) {
        resetPlayer();
        update();
    }
}

/*****************************************************************************/
var _sampleCount = 0;
function fillSoundBuffer(left, right, bufferSize, channel) {
    //var samplesPerFrame = _settings.samplingRate / SynthApp.player.refreshRate;
    var start = 0;
    var end = 0;
    var remains = bufferSize;
    for (var i=0; i<bufferSize; i++) {
        left[i] = .0;
        right[i] = .0;
    }
    while (remains) {
        if (_frame == 0) {
            update();
            _frame = _samplePerFrame;
            //SynthApp.frameCounter = _settings.samplingRate / SynthApp.player.refreshRate;
        }
        var len = _frame < remains ? _frame : remains;
        end = start + len;
        _frame -= len;
        for (var i=0; i<_player.channels.length; i++) {
            _player.channels[i].target.run(left, right, start, end);
        }
        start = end;
        remains -= len;
        _sampleCount += len;
    }
    //console.log(_sampleCount);
}

/*****************************************************************************/
async function onpageload(e) {

    Dbg.init('con');
    if (e && e.length) {
        alert(e);
        return;
    }

    Dbg.prln('Creating UI');
    await _app.createUi();

    Dbg.prln('Initializing');
    await _app.initialize();

    var con = document.getElementById('con');
    document.body.removeChild(con);
    document.body.appendChild(con);

    // Dbg.prln('Initialize player');
    // await initializePlayer();

    // Dbg.prln('Load sequence script');
    // await loadSequence('res/demo01.seq');
    // await Ui.Synth.loadPresets('res/presets.json');

    // for (var i=0; i<_series.length; i++) {
    //     Dbg.prln('Add synths');
    //     createSynth(3, i);
    // }

    // Dbg.prln('Add editor');
    // var editor = createEditor(true);
    // editor.dataBind(_series[0]);
    // editor.selectChannel(psynth.SynthAdapter.SETNOTE);

    // await _ui.render({element:document.getElementById('mainPanel')});
   
    // updateBpm();

    // resetPlayer();
}