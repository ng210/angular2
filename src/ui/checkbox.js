include('/ui/valuecontrol.js');

(function() {
	Ui.Checkbox = function(id, config, parent) {
		Ui.ValueControl.call(this, id, config, parent);
	}
	Ui.Checkbox.base = Ui.ValueControl.prototype;
	Ui.Checkbox.prototype = new Ui.ValueControl('checkbox');
	Ui.Control.Types['checkbox'] = { ctor: Ui.Checkbox, tag: 'INPUT' };
	Ui.Checkbox.prototype.getValue = function() { return this.element.checked; };
	Ui.Checkbox.prototype.render = function(ctx) {
    	Ui.Checkbox.base.render.call(this, ctx);
	    this.element.setAttribute('type', 'checkbox');
		this.element.checked = this.value == true;
	};
	Ui.Checkbox.prototype.registerHandler = function(event) {
		if (['change'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
    };


})();