include('valuecontrol.js');

(function() {
	function Button(id, template, parent) {
		Ui.ValueControl.call(this, id, template, parent);
	}
	extend(Ui.ValueControl, Button);

	Ui.Control.Types['button'] = { ctor: Button, tag: 'BUTTON' };

	Button.prototype.getTemplate = function() {
		var template = Button.base.getTemplate.call(this);
		if (!template.events.includes('click')) {
			template.events.push('click');
		}
		template.type = 'button';
		return template;
	};

	Button.prototype.registerHandler = function(event) {
		if (['click', 'mousedown', 'mouseup'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
    };
	Button.prototype.render = async function(ctx) {
    	Button.base.render.call(this, ctx);
	};
	
	Ui.Button = Button;
})();