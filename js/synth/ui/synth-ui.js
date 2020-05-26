include('/lib/ui/ui-lib.js');

(function() {
    load('/synth/ui/synth.css');
    function Synth(id, tmpl, parent) {
        Ui.Board.call(this, id, tmpl, parent);
        this.preset = 'default';
        this.layout = Ui.Container.Layout.Vertical;

        var toolbarTemplate = {
            type: 'board',
            titlebar: false,
            items: {
                'on': { type: 'button', value:'', css:'onOff' },
                'preset': { type: 'ddlist', css: 'preset', 'items': Synth.presets, 'item-value': '$key', 'data-source': this, 'data-field': 'preset', events:['change'] },
                'save': { type: 'button', value:'Save', css:'preset save' },
                'remove': { type: 'button', value:'Remove', css: 'preset remove' }
            }
        };
        this.toolbar = new Ui.Board(`${this.id}_toolbar`, toolbarTemplate, this);
        this.add('toolbar', this.toolbar);
        this.toolbar.items.on.render = Synth.renderOnOff;
        this.toolbar.items.on.onclick = Synth.onOnOffClick;
        this.toolbar.items.preset.onchange = Synth.onPresetChange;
        this.toolbar.items.save.onclick = Synth.onPresetSaveClick;
        this.toolbar.items.remove.onclick = Synth.onPresetRemoveClick;

        this.modules = new Ui.Board(`${this.id}_modules`, { titlebar:false }, this);
        this.add('modules', this.modules);
    }
    extend(Ui.Board, Synth);

    Ui.Control.Types['synth'] = { ctor: Ui.Synth, tag: 'SYNTH' };

    Synth.prototype.getTemplate = function() {
        var template = Synth.base.getTemplate.call(this);
        template.type = 'synth';
        if (!template.events.includes('click')) template.events.push('click');
        return template;
    };

    Synth.prototype.dataBind = function(synth) {
        Synth.base.dataBind.call(this, synth);
        this.toolbar.items.on.dataBind(synth, 'isActive');
        this.controls = {};
        // create items from synth's configuration
        var mdlTypes = ['synth', 'env', 'lfo', 'osc', 'flt'];
        var selectTypes = ['wave', 'mode'];
        var inputs = [{path:[this.id], ctrl:synth.controls, module:this}];
        while (inputs.length > 0) {
            var item = inputs.pop();
            var path = item.path.slice(1).join('.');
            if (item.ctrl instanceof psynth.Pot) {
                if (item.ctrl == synth.getControl(psynth.Ctrl.amp)) {
                    var control = new Ui.Slider(item.path.join('_'), {numeric:true, 'data-type':Ui.Control.DataTypes.Float, min:0, max:100, step:1, digits:0, 'decimal-digits':0}, this);
                    this.modules.add('amp', control);
                    control.dataBind(item.ctrl, 'value');
                    this.controls[path] = control;
                } else {
                    var type = item.path[item.path.length-1];
                    var control = null;
                    if (selectTypes.indexOf(type) == -1) {
                        control = new Ui.Pot(item.path.join('_'), {'numeric': true, digits:0, 'decimal-digits':0}, this)
                        control.css.push('pot');
                    } else {
                        control = new Ui.Select(item.path.join('_'), {titlebar:false, 'data-type': 'bool', 'item-type': 'label', flag:true}, this);
                        control.css.push('select');
                        if (type == 'wave') {
                            for (var i in psynth.WaveForms) {
                                if (i == 'None') continue;
                                var key = i.toLowerCase();
                                control.addOption(key, psynth.WaveForms[i]);    //new Ui.Label(`${control.id}#${key}`, {numeric:true,value:psynth.WaveForms[i]}));
                            }
                        } else if (type == 'mode') {
                            for (var i in psynth.FilterModes) {
                                var key = i.toLowerCase();
                                control.addOption(key, new Ui.Label(`${control.id}_${key}`, {numeric:true,value:psynth.FilterModes[i]}));
                            }
                        }
                    }                
                    var id = item.path.slice(-2);
                    control.dataBind(item.ctrl, 'value');
                    this.controls[path] = control;
                    item.module.add(id[1], control);
                }
            } else {
                for (var i in item.ctrl) {
                    var ctrl = item.ctrl[i];
                    var mdl = item.module;
                    var path = [...item.path, i];
                    if (!(ctrl instanceof psynth.Pot)) {
                        mdl = new Ui.Board(path.join('_'), {titlebar:false}, this);
                        var css = mdlTypes.find(x => i.startsWith(x));
                        mdl.css.push(css);
                        this.modules.add(i, mdl);
                    }
                    inputs.unshift({path: path, ctrl: item.ctrl[i], module: mdl});
                }
            }
        }

    };

    Synth.prototype.render = async function(ctx) {
        Synth.base.render.call(this, ctx);
        {
        // //var synth = new psynth.Synth(48000, voiceCount);
        // voiceCount = synth.voices.length;
        // _synths.push(synth);
        // var synthElem = document.createElement('DIV');
        // synthElem.id = lbl;
        // synthElem.className = 'synth';
        // synthElem.innerHTML = _template.synth1.innerHTML.replace(/{{id}}/g, lbl);
        // synthElem.synth = synth;
        // synth.element = synthElem;

        // // set potmeters
        // var pots = synthElem.getElementsByClassName('pot');
        // for (var i=0; i<pots.length; i++) {
        //     Pot.bind(pots[i], synth);
        // }
        // // set waveform toggles
        // var toggles = synthElem.querySelectorAll('toggle');
        // for (var i=0; i<toggles.length; i++) {
        //     var toggle = toggles[i];
        //     toggle.bar = document.createElement('div');
        //     toggle.bar.className = 'toggle bar';
        //     toggle.appendChild(toggle.bar);
        //     toggle.onclick = toggleWaveform;
        //     toggle.value = psynth[toggle.getAttribute('value')];
        //     toggle.state = false;
        //     toggle.pot = synth.getControl(psynth.Ctrl[toggle.getAttribute('bind')]);
        // }

        // var select = synthElem.querySelector('select.preset');
        // getPresets(select);
        // select.onchange = selectPreset;
        // synthElem.querySelector('.preset.save').onclick = savePreset;
        // synthElem.querySelector('.preset.remove').onclick = removePreset;
        // // todo: store and reload preset from local storage
        // select.selectedIndex = 0;
        // selectPreset({target:select});
        // //synth.setup(_presets.default);

        // var pot = synth.getControl(psynth.Ctrl.lfo2amp);
        // pot.element.scale = 10;
        // pot.max = 10;
        // pot.element.innerHTML = pot.value * pot.element.scale;

        // // create voices LEDs
        // synth.voiceLeds = [];
        // var tbl = synthElem.querySelector('#voiceLEDs') || document.createElement('table');
        // tbl.id = lbl + 'VoiceLEDs';
        // var tr =  document.createElement('tr');
        // tbl.appendChild(tr);
        // for (var i=0; i<voiceCount; i++) {
        //     var td = document.createElement('td');
        //     td.className = 'led';
        //     var led = document.createElement('div');
        //     led.className = 'led';
        //     synth.voiceLeds.push(led);
        //     td.appendChild(led);
        //     tr.appendChild(td);
        // }
        // synthElem.querySelector('div.voiceLEDs').appendChild(tbl);
        // return synthElem;
        }
    };

    Synth.prototype.createPreset = function(name) {
        var preset = {};
        for (var key in this.controls) {
            if (this.controls[key] instanceof Ui.ValueControl) {
                preset[key] = this.controls[key].dataSource.value;
            }
        }
        this.toolbar.items.preset.add(name, preset);
        this.toolbar.items.preset.select(name);
    };
    Synth.prototype.changePreset = function(id) {
        var preset = Synth.presets[id];
        if (preset) {
            for (var key in preset) {
                var ctrl = this.controls[key];
                // if (ctrl instanceof Ui.Select) {
                //     ctrl.dataSource.value = preset[key];
                // } else
                if (ctrl instanceof Ui.ValueControl) {
                    ctrl.dataSource.value = preset[key];
                }
            }
        }
    };


    Synth.renderOnOff = function(ctx) {
        this.getValue() ? this.addClass('on') : this.removeClass('on');
        Ui.Control.prototype.render.call(this, ctx);
    };
    Synth.onOnOffClick = function(e) {
        var toggle = this.getValue();
        this.setValue(!toggle);
        return true;
    };
    Synth.onPresetChange = function(e) {
        Ui.DropDownList.prototype.onchange.call(this, e);
        var synthUi = e.control.parent.parent;
        synthUi.changePreset(synthUi.preset);
        synthUi.render();
    };
    Synth.onPresetSaveClick = function(e) {
        var synthUi = e.control.parent.parent;
        var preset = synthUi.toolbar.items.preset.getSelected();
        var key = preset.key || 'Preset' + Object.keys(Synth.presets).length;
        var name = prompt('Preset name?', key);
        if (name == 'default') {
            alert('Please use a different name!');
            Synth.onPresetSaveClick(e);
            return;
        }
        if (name != null) {
            synthUi.createPreset(name);
        }
    };
    Synth.onPresetRemoveClick = function(e) {
        alert(e.control.id);
    };

    // preset management
    Synth.presets = {};
    Synth.loadPresets = async function loadPresets(url) {
        var presets = JSON.parse(localStorage.getItem('psynth'));
        if (!presets) {
            var res = await load(url || './presets.json');
            if (res.error instanceof Error) {
                presets = {
                    "default": {
                        "amp":      1.00,

                        "lfo1.amp": 0.20, "lfo1.dc":  0.50, "lfo1.fre":  0.30, "lfo1.wave": 1,
                        "lfo2.amp": 1.00, "lfo2.dc":  0.00, "lfo2.fre":  0.50, "lfo2.wave": 1,
                
                        "env1.amp": 0.70, "env1.dc":  0.00, "env1.atk":  0.00, "env1.dec": 0.10, "env1.sus": 0.40, "env1.rel": 0.20,
                        "env2.amp": 0.28, "env2.dc":  0.70, "env2.atk":  0.04, "env2.dec": 0.10, "env2.sus": 0.90, "env2.rel": 0.12,
                
                        "osc1.amp": 0.40, "osc1.fre": 1.00, "osc1.tune": 0.00, "osc1.psw": 0.00, "osc1.wave": 2,
                        "osc2.amp": 0.50, "osc2.fre": 0.00, "osc2.tune": 0.00, "osc2.psw": 0.80, "osc2.wave": 12
                    }
                };
            } else {
                presets = res.data;
            }
        }
        for (var i in presets) {
            if (presets.hasOwnProperty(i)) {
                Synth.presets[i] = presets[i];
            }
        }
        Dbg.prln(`${Object.keys(Synth.presets).length} presets loaded.`);
    };

    // Synth.prototype.getPresets = async function getPresets(select) {
    //     localStorage.setItem('psynth', JSON.stringify(_presets));
    //     for (var key in _presets) {
    //         var hasPreset = false;
    //         for (var i=0; i<select.options.length; i++) {
    //             var option = select.options[i];
    //             if (option.label == key) {
    //                 option.value = key;
    //                 hasPreset = true;
    //                 break;
    //             }
    //         }
    //         if (!hasPreset) {
    //             var option = document.createElement("option");
    //             option.label = key;
    //             option.value = key;
    //             select.add(option);
    //         }
    //     }
    //     for (var i=0; i<select.options.length; i++) {
    //         var isUsed = false;
    //         for (var key in _presets) {
    //             if (select.options[i].label == key) {
    //                 isUsed = true;
    //                 break;
    //             }
    //         }
    //         if (!isUsed) {
    //             select.remove(i);
    //             i--;
    //         }
    //     }
    // }
    // function updatePresets() {
    //     localStorage.setItem('psynth', JSON.stringify(_presets));
    //     var selectors = document.querySelectorAll('.controls select.preset');
    //     for (var i=0; i<selectors.length; i++) {
    //         getPresets(selectors[i]);
    //     }
    // }
    // function selectPreset(e) {
    //     var select = e.target;
    //     var preset = _presets[select.selectedOptions[0].value];
    //     var synthElem = select.parentNode.parentNode;
    //     synthElem.synth.setup(preset);
    //     var pots = synthElem.querySelectorAll('pot');
    //     for (var i=0; i<pots.length; i++) {
    //         Pot.update(pots[i]);
    //     }
    //     var toggles = synthElem.querySelectorAll('toggle');
    //     for (var i=0; i<toggles.length; i++) {
    //         var toggle = toggles[i];
    //         toggle.state = (toggle.pot.value & toggle.value) != 0;
    //         enableWaveform(toggle);
    //     }
    // }
    // function savePreset(e) {

    // }
    // function removePreset(e) {
    //     var synth = e.target.parentNode.parentNode;
    //     var select = synth.querySelector('.controls select');
    //     if (select.selectedOptions[0].value != 'default') {
    //         delete _presets[select.selectedOptions[0].value];
    //         updatePresets();
    //         selectPreset({target:select})
    //     } else {
    //         alert('The "default" preset cannot be removed!');
    //     }
    // }
    // function importPresets() {
    //     const fileElem = document.getElementById("fileElem");
    //     fileElem.click();
    // }
    // function handleImport(fileList) {
    //     if (fileList != null && fileList[0] instanceof File) {
    //         const reader = new FileReader();
    //         reader.onload = function(e) {
    //             try {
    //                 _presets = JSON.parse(e.target.result);
    //             } catch (error) {
    //                 alert('Import resulted in an error\n('+error.message+')');
    //                 return;
    //             }
    //             updatePresets();
    //             alert('Preset loaded');
    //         };        
    //         reader.readAsText(fileList[0]);
    //     }
    // }
    // function exportPresets() {
    //     var fileName = prompt('File name?', 'presets.json');
    //     if (fileName != null) {
    //         if (!fileName.endsWith('.json')) {
    //             fileName = fileName+'.json';
    //         }
    //         var data = new Blob([JSON.stringify(_presets)], {type: 'application/json'});
    //         var url = window.URL.createObjectURL(data);
    //         var link = document.getElementById('exportPresets');
    //         link.setAttribute('download', fileName);
    //         link.href = url;
    //         link.click();
    //         window.URL.revokeObjectURL(url)
    //     }
    // }


    Ui.Synth = Synth;
})();
