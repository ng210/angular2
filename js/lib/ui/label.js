include('valuecontrol.js');

(function() {
	function Label(id, template, parent) {
		Ui.ValueControl.call(this, id, template, parent);
	};
	extend(Ui.ValueControl, Label);

	Ui.Control.Types['label'] = { ctor: Label, tag: 'DIV' };

	Label.prototype.getTemplate = function() {
        var template = Label.base.getTemplate.call(this);
        template.type = 'label';
        return template;
	};

	Label.prototype.registerHandler = function(event) {
		if (['click', 'dragging', 'mouseover', 'mouseout', 'mousemove'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
	};
	
	Label.prototype.render = async function(ctx) {
    	Label.base.render.call(this, ctx);
	};

	Ui.Label = Label;

})();