include('/ui/valuecontrol.js');

(function() {
	Ui.Textbox = function(id, template, parent) {
		Ui.ValueControl.call(this, id, template, parent);

		this.constructor = Ui.Textbox;
	};
	Ui.Textbox.base = Ui.ValueControl.prototype;
	Ui.Textbox.prototype = new Ui.ValueControl('textbox');

	Ui.Control.Types['textbox'] = { ctor: Ui.Textbox, tag: 'INPUT' };
	Ui.Textbox.prototype.registerHandler = function(event) {
		if (['change', 'key'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
    };
    Ui.Textbox.prototype.render = function(ctx) {
    	Ui.Textbox.base.render.call(this, ctx);
	    this.element.setAttribute('type', 'text');
		this.element.setAttribute('size', this.template.size || 4);
    };
})();