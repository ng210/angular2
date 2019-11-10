include('/base/dbg.js');

include('/ge/sound.js');
include('./synth.js');
include('./synth-adapter.js');
include('./pot.js');
include('/ge/player/player.js');

include('/utils/syntax.js');
include('grammar.js');

include('/ui/multichart.js');
include('framedataseries.js');

var _synth = null;
var _synthCount = 3;
var _isRunning = false;
//var _config1 = null;
var _frame = 0;
var _presets = null;
var _presetSelect = null;
var _timer = null;
var _lastNote = 0;
var _frame = 0;
var _playerFrame = 0;
var _synths = [];
var _ledColor = [128, 160, 255];
var _player = null;
var _samplePerFrame = 0;
//var _cursor = 0;
var _buffer = new Float32Array(16*1024);



var _masterTune = 12;



var _patternConfig = {
    'width': 320,
    'height': 120,
    'grid-color': [0.3, 0.4, 0.5],
    'unit': [10, 5],
    'titlebar': 'Pattern1'
};

var _patternUi = [];
var _patterns = [];

async function loadTemplate() {
    var res = await load('./synth.tmpl.html');
    if (res.error instanceof Error) {
        alert(res.error);
        return;
    }
    _template = {};
    // envelope
    _template.env = res.node.querySelector('div.env');
    // osc
    _template.osc = res.node.querySelector('div.osc');
    // lfo
    _template.lfo = res.node.querySelector('div.lfo');
    // filter
    _template.flt = res.node.querySelector('div.flt');
    // synth1 (solo)
    _template.synth1 = buildSynthTemplate(res.node.querySelector('div.synth1'));
    // synth2 (bass)
    //_template.synth2 = buildSynthTemplate(res.node.querySelector('div.synth2'));
}

async function loadPresets() {
    _presets = JSON.parse(localStorage.getItem('psynth'));
    if (!_presets) {
        var res = await load('./presets.json');
        if (res.error instanceof Error) {
            _presets = {
                'default': [
                    psynth.Ctrl.amp, 1.0,
            
                    psynth.Ctrl.lfo1amp, 0.2, psynth.Ctrl.lfo1dc, 0.5, psynth.Ctrl.lfo1fre, 3.3, psynth.Ctrl.lfo1wave, psynth.WF_SIN,
                    psynth.Ctrl.lfo2amp, 2.0, psynth.Ctrl.lfo2dc, 0.0, psynth.Ctrl.lfo2fre, 6.1, psynth.Ctrl.lfo2wave, psynth.WF_SIN,
            
                    psynth.Ctrl.env1amp, 0.7, psynth.Ctrl.env1dc, 0, psynth.Ctrl.env1atk, 0.0, psynth.Ctrl.env1dec, 0.1, psynth.Ctrl.env1sus, 0.4, psynth.Ctrl.env1rel, 0.2,
                    psynth.Ctrl.env2amp, 0.28, psynth.Ctrl.env2dc, 0.7,psynth.Ctrl.env2atk, 0.04, psynth.Ctrl.env2dec, 0.1, psynth.Ctrl.env2sus, 0.9, psynth.Ctrl.env2rel, 0.12,
            
                    psynth.Ctrl.osc1amp, 0.4, psynth.Ctrl.osc1fre, 1.0, psynth.Ctrl.osc1psw, 0.0, psynth.Ctrl.osc1wave, psynth.WF_TRI, psynth.Ctrl.osc1tune, 0,
                    psynth.Ctrl.osc2amp, 0.5, psynth.Ctrl.osc2fre, 0.0, psynth.Ctrl.osc2psw, 0.0, psynth.Ctrl.osc2wave, psynth.WF_PLS, psynth.Ctrl.osc2tune, 12
                ]
            };
        } else {
            _presets = res.data;
        }
    }
}

function buildSynthTemplate(synth) {
    var modules = synth.querySelector('.modules').children;
    for (var i=0; i<modules.length; i++) {
        var node = modules[i];
        var className = node.className.toLowerCase().split(' ')[0];
        var template = _template[className];
        if (template != undefined) {
            var lbl = node.id.split('}}')[1];
            node.innerHTML = template.innerHTML.replace(/{{id}}/g, lbl);
        }
    }
    synth.querySelector('div.osc').onclick = alert;
    return synth;
}

async function createSynth(lbl, synth) {
    //var synth = new psynth.Synth(48000, voiceCount);
    voiceCount = synth.voices.length;
    _synths.push(synth);
    var synthElem = document.createElement('DIV');
    synthElem.id = lbl;
    synthElem.className = 'synth';
    synthElem.innerHTML = _template.synth1.innerHTML.replace(/{{id}}/g, lbl);
    synthElem.synth = synth;

    // set potmeters
    var pots = synthElem.getElementsByClassName('pot');
    for (var i=0; i<pots.length; i++) {
        Pot.bind(pots[i], synth);
    }
    // set waveform toggles
    var toggles = synthElem.querySelectorAll('toggle');
    for (var i=0; i<toggles.length; i++) {
        var toggle = toggles[i];
        toggle.bar = document.createElement('div');
        toggle.bar.className = 'toggle bar';
        toggle.appendChild(toggle.bar);
        toggle.onclick = toggleWaveform;
        toggle.value = psynth[toggle.getAttribute('value')];
        toggle.state = false;
        toggle.pot = synth.getControl(psynth.Ctrl[toggle.getAttribute('bind')]);
    }

    var select = synthElem.querySelector('select.preset');
    getPresets(select);
    select.onchange = selectPreset;
    synthElem.querySelector('.preset.save').onclick = savePreset;
    synthElem.querySelector('.preset.remove').onclick = removePreset;
    // todo: store and reload preset from local storage
    select.selectedIndex = 0;
    selectPreset({target:select});
    //synth.setup(_presets.default);

    var pot = synth.getControl(psynth.Ctrl.lfo2amp);
    pot.element.scale = 10;
    pot.max = 10;
    pot.element.innerHTML = pot.value * pot.element.scale;

    // create voices LEDs
    synth.voiceLeds = [];
    var tbl = synthElem.querySelector('#voiceLEDs') || document.createElement('table');
    tbl.id = lbl + 'VoiceLEDs';
    var tr =  document.createElement('tr');
    tbl.appendChild(tr);
    for (var i=0; i<voiceCount; i++) {
        var td = document.createElement('td');
        td.className = 'led';
        var led = document.createElement('div');
        led.className = 'led';
        synth.voiceLeds.push(led);
        td.appendChild(led);
        tr.appendChild(td);
    }
    synthElem.querySelector('div.voiceLEDs').appendChild(tbl);
    var style = window.getComputedStyle(synthElem);
    var match = style.backgroundColor.match(/\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
    var color = match != null ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : _ledColor;
    for (var i=0; i<3; i++) {
        color[i] = Math.floor((255 - color[i]) * 1.8);
        if (color[i] > 255) color[1] = 255;
    }
    synth.voiceLeds.color = color;

    return synthElem;
}

function multiChartOnClick(ctrl, e) {
    this.__proto__.onclick.call(this, ctrl, e);
    this.dataSource.sequence.fromFrames(this.dataSource.data);
    return true;
}

async function createPatternUi(id, el) {
    var lbl = `Pattern${id}`;
    var multiChart = new Ui.MultiChart(`${lbl}_chart`, _patternConfig, null);
    multiChart.template.titlebar = lbl;
    multiChart.dataBind(_patterns[id]);
    multiChart.selectedChannelId = psynth.SynthAdapter.SETNOTE;
    multiChart.onclick = multiChartOnClick;
    var ix = _patternUi.length;
    _patternUi.push(multiChart);
    var info = _patterns[ix].getRange(multiChart.selectedChannelId, 0, 255);
    console.log(info.max);
    multiChart.scroll(0, -12*10);
    multiChart.uniforms.uRange = info.max;
    await multiChart.render({'element': el});
}

function fillSoundBuffer(buffer, bufferSize) {
    //var samplesPerFrame = 48000 / SynthApp.player.refreshRate;
    var start = 0;
    var end = 0;
    var remains = bufferSize;
    for (var i=0; i<bufferSize; i++) {
        buffer[i] = .0;
    }
    while (remains) {
        if (_frame == 0) {
            update();
            _sum = 0;
            _frame = _samplePerFrame;
            //SynthApp.frameCounter = 48000 / SynthApp.player.refreshRate;
        }
        var len = _frame < remains ? _frame : remains;
        end = start + len;
        _frame -= len;
        for (var i=0; i<_player.channels.length; i++) {
            _player.channels[i].target.run(buffer, start, end);
        }
        start = end;
        remains -= len;
    }
    for (var i=0; i<bufferSize; i++) {
        _buffer[i] = buffer[i];
    }
}

var tones = {
    'c': 0, 'c#': 1, 'd': 2, 'd#': 3, 'e': 4, 'f':5, 'f#': 6, 'g': 7, 'g#': 8, 'a': 9, 'a#': 10, 'h': 11,
    'C': 12, 'C#': 13, 'D': 14, 'D#': 15, 'E': 16, 'F':17, 'F#':18, 'G':19, 'G#':20, 'A':21, 'A#':22, 'H':23
};

async function initializePlayer() {
    _player = new Player();
    // ADAPTERS
    // add adapter singletons
    _player.adapters[psynth.SynthAdapter.getInfo().id] = psynth.SynthAdapter;
    // initialize adapters: create targets and create context
    psynth.SynthAdapter.createTargets(_player.targets, new Uint8Array(
        [
                3, 
                psynth.SynthAdapter.DEVICE_SYNTH, 2,    // synth with 2 voices
                psynth.SynthAdapter.DEVICE_SYNTH, 6,    // synth with 6 voices
                psynth.SynthAdapter.DEVICE_SYNTH, 2     // synth with 2 voices
        ]));

    //psynth.SynthAdapter.createContext();
    sound.init(48000, fillSoundBuffer);

    // SEQUENCES
    var sequences = await createSequences('demo02.seq');

    for (var i=0; i<_synthCount; i++) {
        // var sequence = new Player.Sequence(psynth.SynthAdapter.getInfo().id);
        // // init sequence
        // sequence.writeHeader();
        // var delta = 0;
        // for (var j=0; j<16; j++) {
        //     // note on
        //     sequence.writeDelta(delta);
        //     sequence.writeCommand(psynth.SynthAdapter.SETNOTE);
        //     sequence.writeUint8(_masterTune);
        //     sequence.writeUint8(127);
        //     // end of frame
        //     sequence.writeEOF();
        //     delta = 1;
        //     // note off
        //     sequence.writeDelta(delta);
        //     sequence.writeCommand(psynth.SynthAdapter.SETNOTE);
        //     sequence.writeUint8(_masterTune);
        //     sequence.writeUint8(0);
        //     // end of frame
        //     sequence.writeEOF();
        // }
        // // end of sequence
        // sequence.writeDelta(delta);
        // sequence.writeEOS();

        var sequence = sequences[i];

        _patterns[i] = new FrameDataSeries(sequence.toFrames(_player), psynth.SynthAdapter);
        _patterns[i].sequence = sequence;

        // create channel
        var channel = new Player.Channel(`channel${i}`, _player);
        channel.loopCount = 1000;
        channel.assign(_player.targets[i], sequence);
        _player.channels.push(channel);
    }
}

async function createSequences(path) {
    var res = await load(path);
    if (res.error instanceof Error) {
        throw res.error;
    }
    var sequences = [];
    var syntax = new Syntax(_grammar);
    var lines = res.data.split('\n');
    var i=0;
    while (i<lines.length) {
        var sequence = new Player.Sequence(psynth.SynthAdapter.getInfo().id);
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

function update() {
    for (var i=0; i<_player.channels.length; i++) {
        _player.channels[i].run(1);
    }
}

function main(frame) {
    //if (_timer) clearTimeout(_timer);
    window.requestAnimationFrame(main);
    //_timer = setTimeout(main, 30, _frame);
    // paint voice LEDs
    for (var i=0; i<_synths.length; i++) {
        var synth = _synths[i];
        for (var j=0; j<synth.voiceLeds.length; j++) {
            var led = synth.voiceLeds[j];
            var a = synth.voices[j].envelopes[0].timer;
            led.style.backgroundColor = `rgba(${synth.voiceLeds.color.join()},${a})`;
        }
    }
    // paint oscillators
}

function updateBpm() {
    // bpm 4th per minute => bpm*8/60 8th per second = bpm/7.5
    _samplePerFrame = Math.floor(48000*7.5/this.pot.value);
}

async function getPresets(select) {
    localStorage.setItem('psynth', JSON.stringify(_presets));
    for (var key in _presets) {
        var hasPreset = false;
        for (var i=0; i<select.options.length; i++) {
            var option = select.options[i];
            if (option.label == key) {
                option.value = key;
                hasPreset = true;
                break;
            }
        }
        if (!hasPreset) {
            var option = document.createElement("option");
            option.label = key;
            option.value = key;
            select.add(option);
        }
    }
    for (var i=0; i<select.options.length; i++) {
        var isUsed = false;
        for (var key in _presets) {
            if (select.options[i].label == key) {
                isUsed = true;
                break;
            }
        }
        if (!isUsed) {
            select.remove(i);
            i--;
        }
    }
}

function updatePresets() {
    localStorage.setItem('psynth', JSON.stringify(_presets));
    var selectors = document.querySelectorAll('.controls select.preset');
    for (var i=0; i<selectors.length; i++) {
        getPresets(selectors[i]);
    }
}

function selectPreset(e) {
    var select = e.target;
    var preset = _presets[select.selectedOptions[0].value];
    var synthElem = select.parentNode.parentNode;
    synthElem.synth.setup(preset);
    var pots = synthElem.querySelectorAll('pot');
    for (var i=0; i<pots.length; i++) {
        Pot.update(pots[i]);
    }
    var toggles = synthElem.querySelectorAll('toggle');
    for (var i=0; i<toggles.length; i++) {
        var toggle = toggles[i];
        toggle.state = (toggle.pot.value & toggle.value) != 0;
        enableWaveform(toggle);
    }
}

function savePreset(e) {
    var synthElem = e.target.parentNode.parentNode;
    var name = prompt('Preset name?', 'Preset'+Object.keys(_presets).length);
    if (name == 'default') {
        alert('Please use a different name!');
        savePreset(e);
        return;
    }
    if (name != null) {
        var preset = [];
        for (var key in psynth.Ctrl) {
            var ctrlId = psynth.Ctrl[key];
            preset.push(ctrlId, synthElem.synth.getControl(ctrlId).value);
        }
        _presets[name] = preset;
        updatePresets();
        synthElem.querySelector('select.preset').selectedIndex = Object.keys(_presets).findIndex(x => x == name);
    }
}

function removePreset(e) {
    var synth = e.target.parentNode.parentNode;
    var select = synth.querySelector('.controls select');
    if (select.selectedOptions[0].value != 'default') {
        delete _presets[select.selectedOptions[0].value];
        updatePresets();
        selectPreset({target:select})
    } else {
        alert('The "default" preset cannot be removed!');
    }
}

function toggleWaveform(e) {
    var toggle = e.target.parentNode;
    toggle.state = !toggle.state;
    enableWaveform(toggle);
}

function enableWaveform(toggle, enable) {
    var waveform = toggle.pot.value;
    if (enable || toggle.state) {
        toggle.bar.style.opacity = '0.0';
        waveform |= toggle.value;
    } else {
        toggle.bar.style.opacity = '0.6';
        waveform &= ~toggle.value;
    }
    toggle.pot.set(waveform);
}

function importPresets() {
    const fileElem = document.getElementById("fileElem");
    fileElem.click();
}

function handleImport(fileList) {
    console.log(fileList);
    if (fileList != null && fileList[0] instanceof File) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                _presets = JSON.parse(e.target.result);
            } catch (error) {
                alert('Import resulted in an error\n('+error.message+')');
                return;
            }
            updatePresets();
            alert('Preset loaded');
        };        
        reader.readAsText(fileList[0]);
    }
}

function exportPresets() {
    var fileName = prompt('File name?', 'presets.json');
    if (fileName != null) {
        if (!fileName.endsWith('.json')) {
            fileName = fileName+'.json';
        }
        var data = new Blob([JSON.stringify(_presets)], {type: 'application/json'});
        var url = window.URL.createObjectURL(data);
        var link = document.getElementById('exportPresets');
        link.setAttribute('download', fileName);
        link.href = url;
        link.click();
        window.URL.revokeObjectURL(url)
    }
    
}

async function buildUi() {
    var tab = document.getElementById('modules');
    for (var i=0; i<_synthCount; i++) {
        var tr = document.createElement('TR');
        // create synth
        var td = document.createElement('TD');
        var lbl = 'synth' + (i+1);
        psynth.SynthAdapter.devices[i].label = lbl;
        td.appendChild(await createSynth(lbl, psynth.SynthAdapter.devices[i]));
        tr.appendChild(td);
        // create pattern
        td = document.createElement('TD');
        await createPatternUi(i, td);
        tr.appendChild(td);
        tab.appendChild(tr);
    }
}

async function onpageload(e) {
    Dbg.init('con');

    _startButton = document.getElementById('start');
    _startButton.onclick = function() {
        if (_isRunning) {
            sound.stop();
            _startButton.innerText = "Start";
            _isRunning = false;
        } else {
            sound.start();
            _startButton.innerText = "Stop";
            _isRunning = true;
        }
        sound.start;
    };
    var bpm = document.getElementById('bpm');
    bpm.onchange = updateBpm;
    _bpm = new psynth.Pot(0, 1, 0);
    Pot.bind(bpm, _bpm);
    updateBpm.call(bpm);
   
    document.getElementById('import').onclick = importPresets;
    document.getElementById('export').onclick = exportPresets;

    await loadTemplate();

    await loadPresets();

    await initializePlayer();

    await buildUi();
    
    main();
}