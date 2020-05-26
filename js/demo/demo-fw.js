include('/base/dbg.js');
include('/ge/ge.js');
include('/demo/demo.js');
//include('/lib/ui/grid.js');

var canvas_ = null;
var list_ = null;
var settings_ = null;
var demos_ = [];

var demoList_ = [
    { name:'bump', description: '2d bump mapping' },
    { name:'dots', description: 'Point-point and point-line segment collision in 2d' },
    { name:'fire', description: '2d fire based on heat map' },
    { name:'gravity', description: 'Simulation of gravitational force in 2d' },
    { name:'lens', description: 'Lensing effect' },
    { name:'noise', description: 'FBM based on value noise' },
    { name:'plasma', description: 'Old school plasma effect' },
    { name:'rotozoom', description: 'Rotating and zooming plain' },
    { name:'testui', description: 'Test of available UI controls' },
    { name:'texgen', description: 'Primitive texture generator' },
    { name:'wormhole', description: 'Wormhole effect' }
];

function onpageload(errors) {
    if (errors && errors.length > 0) {
        alert('Error during loading!\n' + errors.join('\n'));
    }
    canvas_ = document.querySelector('#cvs');
    settings_ = document.querySelector('#settings');
    list_ = document.querySelector('#list');
    //adjustContainer(settings_);
    //adjustPanel(list_);

    GE.init(canvas_);
    Dbg.init('con', canvas_.width);
    Dbg.prln('Demo-fw 0.1');
    Dbg.con.style.visibility = 'visible';

    demoResize();

    // run main loop
    GE.processInputs = demoProcessInputs;
    GE.update = demoUpdate;
    GE.render = demoRender;

    var url = new Url(document.URL);
    var demoId = url.query.id || url.fragment;

    createDemoList();

    createDemo(demoId);
}

function adjustContainer(ctrl) {
    // var el = ctrl.element;
    // el.style.zIndex = 1000;
    function isChild(container, ctrl) {
        var node = ctrl;
//console.log(container.id, node);
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
    ctrl.onclick = function(control, target) {
        this.clicked = this.clicked == true;
        this.element.style.opacity = 0.7;
    };
    ctrl.onmouseover = function(control, target) {
//console.log(`over ${control.id}, ${target.id}`);
//this.element.style.border = 'solid 2px blue';
        // if (this.clicked != true) {
        this.element.style.opacity = this.clicked ? 0.7 : 0.2;
        // }
    };
    ctrl.onmouseout = function(control, target) {
//console.log(`out ${control.id}, ${target.id}`);
//this.element.style.border = 'none 2px blue';
        // if (!isChild(this, target)) {
        this.element.style.opacity = 0.1;
        //this.clicked = false;
        // }
    };
    // ctrl.registerHandler('click');
    // ctrl.registerHandler('mouseover');
    // ctrl.registerHandler('mouseout');

    //el.style.opacity = 0.1;
}

function createDemoList() {
    var list = new Ui.Grid('demoList', {
        "type": "grid",
        "titlebar": "Demos",
        "row-template": {
            "name": {
                "type":"label", "data-field":"name"
            },
            "description": {
                "type":"label", "data-field":"description"
            },
        },
        "events": ["click"]
    });
    list.dataBind(demoList_);
    //list.dataBind(new Url('/demo/'));

    function toggle(ctrl, propName, initValue) {
        if (ctrl.toggle == undefined) {
            ctrl.toggle = {};
        }
        if (ctrl.toggle[propName] == undefined) {
            ctrl.toggle[propName] = initValue;
        }
        var tmp = ctrl.element.style[propName];
        ctrl.element.style[propName] = ctrl.toggle[propName];
        ctrl.toggle[propName] = tmp;
    }

    function colToRgb(col) {
        var n = parseInt(col.substring(1), 16);
        return [n>>16, (n>>8) & 0xff, n & 0xff];
    }

    function rgbToCol(rgb) {
        var r = ('00' + rgb[0].toString(16)).slice(-2);
        var g = ('00' + rgb[1].toString(16)).slice(-2);
        var b = ('00' + rgb[2].toString(16)).slice(-2);
        return `#${r}${g}${b}`;
    }

    function rgbAdd(rgb1, rgb2) {
        var rgb = [0, 0, 0];
        rgb[0] = rgb1[0] + rgb2[0]; if (rgb[0] > 255) rgb[0] = 255;
        rgb[1] = rgb1[1] + rgb2[1]; if (rgb[1] > 255) rgb[1] = 255;
        rgb[2] = rgb1[2] + rgb2[2]; if (rgb[2] > 255) rgb[2] = 255;
        // for (var i=0; i<3; i++) {
        //     var c = rgb1[i] + rgb2[i];
        //     if (c > 255) c = 255;
        //     rgb[i] = c;
        // }
        return rgb;
    }

    list.onclick = function(control, target) {
        toggle(target.row, 'backgroundColor', 'blue');
        toggle(target.row, 'color', 'white');
    };
    list.onmouseover = function(control, target) {
        var rgb = colToRgb(target.row.element.style.backgroundColor);
        rgb = rgbAdd(rgb, [10, 10, 10]);
        target.row.element.style.backgroundColor = rgbToCol(rgb);
        //toggle(target.row, 'backgroundColor', 'lightblue');
    };
    list.onmouseout = function(control, target) {
        toggle(target.row, 'backgroundColor', 'lightblue');
    };

    list.registerHandler('click');
    list.registerHandler('mouseover');
    // list.registerHandler('mouseout');
    list.render( { 'element':list_ });
}

async function createDemo(id) {
    try {
        // async load demo
        var demo = await Demo.load(id);
        if (demo !== null) {
            // set up ui
            demo.createUi();
            //adjustContainer(demo.ui);
            // do async preparations, like loading resources
            await demo.prepare();
            // initialize demo after
            demo.initialize();
            // render ui into the #settings_ node
            demo.renderUi(settings_);
            demos_.push(demo);

            // start main loop
            GE.start();
        }
    } catch (error) {
        Dbg.prln(error.stack);
    }
}

function demoProcessInputs() {
    for (var i=0; i<demos_.length; i++) {
        demos_[i].processInputs();
    }
}

function demoUpdate(frame, dt) {
    for (var i=0; i<demos_.length; i++) {
        demos_[i].update(frame, dt);
    }
}

function demoRender(frame, dt) {
    for (var i=0; i<demos_.length; i++) {
        demos_[i].render(frame, dt);
    }
}

function demoResize() {
    var cnt = document.querySelector('#cvs-container');
    // rescale canvas
    GE.canvas.style.width = cnt.clientWidth;
    GE.canvas.style.height = cnt.clientHeight;
    // resize and position debug console
    Dbg.con.style.width = cnt.clientWidth;
    var top = 3*cnt.clientHeight/4;
    Dbg.con.style.height = cnt.clientHeight - top;
    Dbg.con.style.top = top;
}

window.onresize = function(e) {
    demoResize(e);
    for (var i=0; i<demos_.length; i++) {
        demos_[i].onresize(e);
    }
}