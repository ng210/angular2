include('/base/dbg.js');
include('/ge/ge.js');
include('webgl.js');

var _cvs = null;
var _cnt = null;
var _con = null;
var _menu = null;
function onpageload() {
	try {
		Dbg.init('con');
		GE.init('#cvs', GE.MODE_WEBGL);
		GE.T = 40;

		_cvs = document.querySelector('#cvs');
		_cnt = document.querySelector('#cvs-container');
		_con = document.querySelector('#con');
		_menu = document.querySelector('#menu');

		if (gl == null) throw new Error('webGL not supported!');
		prepareScene();
		GE.processInputs = processInputs;
		GE.update = update;
		GE.render = render;
		processInputs();
		resize();

		Dbg.prln('Initialized.');
		GE.start();

		window.onresize = resize;

	} catch (error) {
		Dbg.prln(error.message);
		Dbg.prln(error.stack);
	}
};
function processInputs() {

}

function update(f) {

}

function render(f) {
	gl.clearColor(0x08/256, 0x18/256, 0x20/256, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function resize() {
	_menu.width = '16em';
	_menu.height = '24em';
	var left = _menu.clientWidth;
	var width = window.innerWidth;
	var height = window.innerHeight;
//alert(Object.keys(window).reduce((v,x) => { if (x.indexOf('idth') != -1) v.push(x); return v; }, []));
	_cvs.style.width = (width - left) + 'px';
	_cvs.style.height = height + 'px';
	_con.style.top = '75vh';
	_con.style.width = '100vw';
}

function prepareScene() {

}