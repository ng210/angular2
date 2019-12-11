include('/ui/valuecontrol.js');

(function() {
	Ui.Slider = function(id, template, parent) {
		Ui.ValueControl.call(this, id, template, parent);
	};
	Ui.Slider.base = Ui.ValueControl.prototype;
	Ui.Slider.prototype = new Ui.ValueControl('slider');
	Ui.Control.Types['slider'] = { ctor: Ui.Slider, tag: 'INPUT' };
	
	Ui.Slider.prototype.render = function(ctx) {
    	Ui.Slider.base.render.call(this, ctx);
	    this.element.setAttribute('type', 'range');
		//this.element.setAttribute('size', this.template.size || 4);
    };

})();