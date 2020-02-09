include('/ui/valuecontrol.js');

(function() {
	Ui.Button = function(id, template, parent) {
		template = template || {};
		template.type = template.type || 'button';
		Ui.ValueControl.call(this, id, template, parent);
	}
	Ui.Button.base = Ui.ValueControl.prototype;
	Ui.Button.prototype = new Ui.ValueControl('button');
	Ui.Control.Types['button'] = { ctor: Ui.Button, tag: 'BUTTON' };

	Ui.Button.prototype.registerHandler = function(event) {
		if (['click', 'mousedown', 'mouseup'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
    };
	Ui.Button.prototype.render = function(ctx) {
    	Ui.Button.base.render.call(this, ctx);
	    //this.element.setAttribute('type', 'button');
    };
})();