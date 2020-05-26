include('valuecontrol.js');

(function() {
	function Slider(id, template, parent) {
		Ui.ValueControl.call(this, id, template, parent);
	};
	extend(Ui.ValueControl, Slider);

	Ui.Control.Types['slider'] = { ctor: Slider, tag: 'INPUT' };

	Slider.prototype.getTemplate = function() {
		var template = Slider.base.getTemplate();
		template.type = 'slider';
		if (!template.events.includes('change')) template.events.push('change');
		if (!template.events.includes('dragging')) template.events.push('dragging');
		return template;
	};
	Slider.prototype.registerHandler = function(event) {
		if (['change', 'dragging'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
	};

	Slider.prototype.ondragging = function(e) {
		this.setValue(this.element.valueAsNumber);
		return true;
	};
	Slider.prototype.onchange = function(e) {
		this.setValue(this.element.valueAsNumber);
	};

	Slider.prototype.render = async function(ctx) {
		Slider.base.render.call(this, ctx);
		this.element.setAttribute('type', 'range');
		this.element.setAttribute('min', this.min);
		this.element.setAttribute('max', this.max);
		this.element.setAttribute('step', this.step);
		//this.element.setAttribute('size', this.template.size || 4);
	};

	Ui.Slider = Slider;
})();