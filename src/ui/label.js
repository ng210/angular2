include('/ui/valuecontrol.js');

(function() {
	Ui.Label = function(id, template, parent) {
		Ui.ValueControl.call(this, id, template, parent);
	};
	Ui.Label.base = Ui.ValueControl.prototype;
	Ui.Label.prototype = new Ui.ValueControl('label');
	Ui.Control.Types['label'] = { ctor: Ui.Label, tag: 'DIV' };
	
	Ui.Label.prototype.registerHandler = function(event) {
		if (['click'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
  };
	Ui.Label.prototype.render = function(ctx) {
    	Ui.Label.base.render.call(this, ctx);
	};

})();