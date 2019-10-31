include('/base/dbg.js');

include('/ge/sound.js');
include('./synth.js');
include('./synth-adapter.js');
include('./pot.js');
include('/ge/player/player.js');

include('/utils/syntax.js');
include('grammar.js');

var _synth = null;
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

// function createConfig() {
//     return [
//         psynth.Ctrl.amp, 1.0,
//
//         psynth.Ctrl.lfo1amp, 0.2, psynth.Ctrl.lfo1dc, 0.5, psynth.Ctrl.lfo1fre, 3.3, psynth.Ctrl.lfo1wave, psynth.WF_SIN,
//         psynth.Ctrl.lfo2amp, 2.0, psynth.Ctrl.lfo2dc, 0.0, psynth.Ctrl.lfo2fre, 6.1, psynth.Ctrl.lfo1wave, psynth.WF_SIN,
//
//         psynth.Ctrl.env1amp, 0.7, psynth.Ctrl.env1dc, 0, psynth.Ctrl.env1atk, 0.0, psynth.Ctrl.env1dec, 0.1, psynth.Ctrl.env1sus, 0.4, psynth.Ctrl.env1rel, 0.2,
//         psynth.Ctrl.env2amp, 0.28, psynth.Ctrl.env2dc, 0.7,psynth.Ctrl.env2atk, 0.04, psynth.Ctrl.env2dec, 0.1, psynth.Ctrl.env2sus, 0.9, psynth.Ctrl.env2rel, 0.12,
//
//         psynth.Ctrl.osc1amp, 0.4, psynth.Ctrl.osc1fre, 1.0, psynth.Ctrl.osc1psw, 0.0, psynth.Ctrl.osc1wave, psynth.WF_TRI, psynth.Ctrl.osc1tune, 0,
//         psynth.Ctrl.osc2amp, 0.5, psynth.Ctrl.osc2fre, 0.0, psynth.Ctrl.osc2psw, 0.0, psynth.Ctrl.osc2wave, psynth.WF_PLS, psynth.Ctrl.osc2tune, 12
//     ];
// }

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
    var synthElem = document.getElementById(lbl);
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

var _masterTune = 12;
var tones = {
    'c': 0, 'c#': 1, 'd': 2, 'd#': 3, 'e': 4, 'f':5, 'f#': 6, 'g': 7, 'g#': 8, 'a': 9, 'a#': 10, 'h': 11,
    'C': 12, 'C#': 13, 'D': 14, 'D#': 15, 'E': 16, 'F':17, 'F#':18, 'G':19, 'G#':20, 'A':21, 'A#':22, 'H':23
};

async function createPlayer() {
    var player = new Player();
    player.adapters[psynth.SynthAdapter.getInfo().id] = psynth.SynthAdapter;
    psynth.SynthAdapter.createTargets(player.targets, new Uint8Array(
        [
                3,  // 2 devices
                psynth.SynthAdapter.DEVICE_SYNTH, 2,    // synth with 2 voices
                psynth.SynthAdapter.DEVICE_SYNTH, 6,    // synth with 6 voices
                psynth.SynthAdapter.DEVICE_SYNTH, 2     // synth with 4 voices
        ]));
    psynth.SynthAdapter.devices[0].label = 'synth1';
    psynth.SynthAdapter.devices[1].label = 'synth2';
    //psynth.SynthAdapter.devices[2].label = 'synth3';
    await createSynth('synth1', psynth.SynthAdapter.devices[0]);
    await createSynth('synth2', psynth.SynthAdapter.devices[1]);
    //await createSynth('synth3', psynth.SynthAdapter.devices[2]);
    return player;
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

async function createChannels() {
    _player = await createPlayer();
    var sequences = await createSequences('demo01.seq');

    // channel #1
    var channel = new Player.Channel('bass', _player);
    channel.loopCount = 1000;
    channel.assign(_player.targets[0], sequences[2]);
    _player.channels.push(channel);

    // channel #2
    channel = new Player.Channel('solo', _player);
    channel.loopCount = 1000;
    channel.assign(_player.targets[1], sequences[1]);
    _player.channels.push(channel);
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
            led.style.backgroundColor = `rgba(${_ledColor.join()},${a})`;
        }
    }
    // paint oscillators
}

function updateBpm() {
    // bpm 4th per minute => bpm*8/60 8th per second = bpm/7.5
    _samplePerFrame = Math.floor(48000*7.5/this.pot.value);
}

function getPresets(select) {
     _presets = JSON.parse(localStorage.getItem('psynth')) || {
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

async function onpageload(e) {
    Dbg.init('con');

    //var content = document.getElementById('content');
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

    await loadTemplate();

    await createChannels();

    // await createSynth('synth1', 4);
    // await createSynth('synth2', 6);
    sound.init(48000, fillSoundBuffer);
    main();
}