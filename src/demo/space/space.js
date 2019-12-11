include('demo.js');
include('asu/asu.js');

(function() {
    function Space(canvas) {
        this.id = 'Test-UI';
        this.canvas = canvas;
        this.config = {};
        this.constructor = Space;
    }
    Space.prototype = new Demo();
    Space.prototype.initialize = function() {
        Asu.initialize();
		Dbg.prln('Space initialize');
	};
    Space.prototype.processInputs = function() { throw new Error('Not implemented'); };
    Space.prototype.update = function(frame) {
    };
    Space.prototype.render = function(frame) {
    };

    Space.prototype.onrender = function(ctrl) {
    };
    Space.prototype.onchange = function(ctrl) {
        Dbg.prln('Space.onchange at ' + ctrl.id);
    };
    Space.prototype.onclick = function(ctrl) {
        Dbg.prln('Space.onclick at ' + ctrl.id);
    };

    public(Space, 'Space');

})();