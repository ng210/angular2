include('/ui/control.js');

(function() {
	// Abstract type for controls holding a single value
	Ui.ValueControl = function(id, template, parent) {
		Ui.Control.call(this, id, template, parent);
		this.isNumeric = false;
		this.parse = null;
		// cache for the value
		this.value = this.template.value || 0;
		switch (this.template['data-type']) {
			case Ui.Control.DataTypes.int:
				this.isNumeric = true;
				this.parse = parseInt;
				break;
			case Ui.Control.DataTypes.float:
				this.isNumeric = true;
				this.parse = parseFloat;
				break;
		}
		if (this.isNumeric) {
			this.min = this.parse(this.template.min); if (this.min === NaN) this.min = 0;
			this.max = this.parse(this.template.max); if (this.max === NaN) this.max = 100;
			this.step = this.parse(this.template.step); if (this.step === NaN) this.step = 1;
		}
		this.dataField = this.template['data-field'];

		this.constructor = Ui.ValueControl;
	}
	//subtype(Ui.ValueControl, Ui.Control)
	Ui.ValueControl.base = Ui.Control.prototype;
	Ui.ValueControl.prototype = new Ui.Control('valuecontrol');
	Ui.ValueControl.prototype.getValue = function() {
		if (this.isNumeric) {
			var v = this.parse(this.element.value);
			this.value = v !== NaN ? v : (this.template.defaultValue || 0);
		} else {
			this.value = this.element.value || '';
		}
		return this.value;
	};
	Ui.ValueControl.prototype.setValue = function(v) {
		//console.log(`value: ${this.value} => ${v}`);
		if (this.isNumeric) {
			if (typeof v !== 'number') {
				v = this.parse(v);
				if (v === NaN) {
					v = this.template.defaultValue || 0;
				}
			}
			this.value = v;
		} else {
			this.value = v || '';
		}
		if (this.element != null) {
			if (this.element.value !== undefined) {
				this.element.value = this.value;
			} else {
				this.element.innerHTML = this.value;
			}			
		}
	};
	Ui.ValueControl.prototype.validate = function() {
		return this.value >= this.min && this.value <= this.max;
	};
	Ui.ValueControl.prototype.registerHandler = function(event) {
		if (['change'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
	};
	Ui.ValueControl.prototype.render = function(ctx) {
		Ui.ValueControl.base.render.call(this, ctx);
		if (this.isNumeric) {
			this.element.setAttribute('min', this.min);
			this.element.setAttribute('max', this.max);
			this.element.setAttribute('step', this.step);
		}
		//var value = (this.dataSource !== undefined && this.dataField !== undefined) ? this.dataSource[this.dataField] : this.value;
		if (this.dataSource !== undefined && this.dataField !== undefined) {
			// validate?
			var v = this.dataSource[this.dataField];
			this.setValue(v);
		}
		// if (this.element.value !== undefined) {
		// 	this.element.value = this.value;
		// }
		 var attribute = this.element.tagName == 'INPUT' ? 'value' : 'innerHTML';
		 this.element[attribute] = this.value;

	};

})();