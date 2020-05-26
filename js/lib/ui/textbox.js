include('valuecontrol.js');

(function() {
	function Textbox(id, template, parent) {
		Ui.ValueControl.call(this, id, template, parent);
	};
	extend(Ui.ValueControl, Textbox);

	Ui.Control.Types['textbox'] = { ctor: Textbox, tag: 'INPUT' };

	Textbox.prototype.getTemplate = function getTemplate() {
		var template = Textbox.base.getTemplate();
		template.type = 'textbox';
		return template;
	};

	Textbox.prototype.registerHandler = function registerHandler(event) {
		if (['change', 'keyup', 'keydown'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
    };
    Textbox.prototype.render = async function render(ctx) {
    	Textbox.base.render.call(this, ctx);
	    this.element.setAttribute('type', 'text');
		this.element.setAttribute('size', this.template.size || 4);
	};
    Textbox.prototype.onchange = function(e) {
		this.setValue(this.element.value);
	};

	Ui.Textbox = Textbox;
})();