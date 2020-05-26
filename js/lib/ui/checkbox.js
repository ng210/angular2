include('valuecontrol.js');

(function() {
	function Checkbox(id, template, parent) {
		Ui.ValueControl.call(this, id, template, parent);
	}
	extend(Ui.ValueControl, Checkbox);
	Ui.Control.Types['checkbox'] = { ctor: Checkbox, tag: 'INPUT' };

	Checkbox.prototype.getTemplate = function() {
		var template = Checkbox.base.getTemplate.call(this);
		template.type = 'checkbox';
		if (!template.events.includes('change')) template.events.push('change');
		return template;
	};

	Checkbox.prototype.render = async function(ctx) {
    	Checkbox.base.render.call(this, ctx);
	    this.element.setAttribute('type', 'checkbox');
		this.element.checked = this.value == true;
	};
	Checkbox.prototype.registerHandler = function(event) {
		if (['change'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
	};
	
    Checkbox.prototype.onchange = function(e) {
        this.setValue(this.element.checked);
    };

	Ui.Checkbox = Checkbox;

})();