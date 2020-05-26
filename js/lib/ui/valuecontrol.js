include('control.js');

(function() {
	var _digits = '0000000000000000';
	// Abstract type for controls holding a single value
	function ValueControl(id, template, parent) {
		Ui.ValueControl.base.constructor.call(this, id, template, parent);
		this.getDataType();
		this.parse = this.dataType == Ui.Control.DataTypes.Float ? parseFloat : parseInt;
		this.defaultValue = this.template.default || 0;
		if (this.isNumeric && this.dataType != Ui.Control.DataTypes.Bool) {
			this.min = this.parse(this.template.min); if (isNaN(this.min)) this.min = 0;
			this.max = this.parse(this.template.max); if (isNaN(this.max)) this.max = 100;
			this.step = this.parse(this.template.step); if (isNaN(this.step)) this.step = 1;
			// default min/max validations
			this.addValidation('value', x => x < this.min, 'Value is less than minimum!', x => this.min);
			this.addValidation('value', x => x > this.max, 'Value is greater than maximum!', x => this.max);
		}
		this.dataLink = null;
		this.fromSource = x => x;
		this.toSource = x => x;
		// this.offset = 0.0;
		this.scale = 1.0;
		this.value = this.template.value;
		this.decimalDigits = this.template['decimal-digits'];
		this.dataBind();
	}
	extend(Ui.Control, ValueControl);

	ValueControl.prototype.getTemplate = function() {
        var template = ValueControl.base.getTemplate();
		template.min = 0;
		template.max = 100;
		template.step = 1;
		template.numeric = null;
		template.value = 0;
		template['data-type'] = null;
		template['data-field'] = null;
		template['default'] = 0;
		template['decimal-digits'] = -1;
		template['digits'] = 0;
        return template;
	};
	ValueControl.prototype.dataBind = function(dataSource, dataField) {
		ValueControl.base.dataBind.call(this, dataSource, dataField)
		if (this.dataSource && this.dataField) {
			var value = this.value;
			if (this.dataType == Ui.Control.DataTypes.Bool) {
				value = this.template['text-true'] || this.value;
			} else {
				if (this.isNumeric) {
					var min = typeof this.dataSource.obj.min === 'number' ? this.dataSource.obj.min : this.min;
					var max = typeof this.dataSource.obj.max === 'number' ? this.dataSource.obj.max : this.max;
					this.scale = (max - min)/(this.max - this.min)
					// (x-min)/(max-min) = (x'-min')/(max'-min')
					// x = (x'-min')(max-min)/(max'-min') + min
					this.toSource = x => (x - this.min)*this.scale + min;
					this.fromSource = x => (x - min)/this.scale + this.min
					this.step = typeof this.dataSource.obj.step === 'number' ? this.fromSource(this.dataSource.obj.step) : this.parse(this.template.step) || this.step;
				}
				value = this.dataSource[this.dataField];
			}
			this.dataLink = new Ui.DataLink(this);
			this.dataLink.link('value', this.dataSource, this.dataField, this.toSource, this.fromSource);
			this.value = this.fromSource ? this.fromSource(value) : value;
		}
		return this.dataSource;
	};
	ValueControl.prototype.getDataType = function() {
		/**************************************
		numeric = (true|false|null)
		data-type = (string|int|bool|float|null)
		 1. n=true,  d=string	=> n=false, d=string +warn
		 2. n=true,  d=int		=> n=true,  d=int
		 3. n=true,  d=float	=> n=true,  d=float
		 4. n=true,  d=null		=> n=true,  d=int
		 5. n=false, d=string	=> n=false, d=string
		 6. n=false, d=int		=> n=true,  d=int    +warn
		 7. n=false, d=float	=> n=true,  d=float  +warn
		 8. n=false, d=null		=> n=false, d=string
		 9. n=null,  d=string	=> n=false, d=string
		10. n=null,  d=int		=> n=true,  d=int
		11. n=null,  d=float	=> n=true,  d=float
		12. n=null,  d=null		=> n=false, d=string
		13. n=true,	 d=bool		=> n=true,	d=bool
		14. n=false, d=bool		=> n=true,	d=bool	+warn
		15. n=null,	 d=bool		=> n=true,	d=bool
		***************************************/

		//  1. n=true,  d=string	=> n=false, d=string +warn
		//  2. n=false, d=string	=> n=false, d=string
		//  3. n=false, d=null		=> n=false, d=string
		//  4. n=null,  d=string	=> n=false, d=string
		//  5. n=null,  d=null		=> n=false, d=string
		var isNumeric = this.template.numeric;
		var dataType = this.template['data-type'] || (isNumeric ? Ui.Control.DataTypes.Int : Ui.Control.DataTypes.String);
		switch (dataType) {
			case Ui.Control.DataTypes.String:
				this.isNumeric = false;
				if (isNumeric === true) {
					console.warn('Inconsistency between numeric=true and data-type=string');
				}
				break;
			case Ui.Control.DataTypes.Bool:
				break;
			case Ui.Control.DataTypes.Int:
			case Ui.Control.DataTypes.Float:
				//  1. n=true,	d=bool		=> n=true,	d=bool
				//     n=false,	d=bool		=> n=true,	d=bool	+warn
				//     n=null,	d=bool		=> n=true,	d=bool
				//  2. n=true,	d=int		=> n=true,	d=int
				//     n=false,	d=int		=> n=true,	d=int	+warn
				//     n=null,	d=int		=> n=true,	d=int
				//  3. n=true,	d=false		=> n=true,	d=false
				//     n=false,	d=false		=> n=true,	d=false	+warn
				//     n=null,	d=false		=> n=true,	d=false
				this.isNumeric = true;
				if (isNumeric === false) {
					console.warn(`Inconsistency between numeric=false and data-type=${dataType}`);
				}
				break;
			default:
				throw new Error(`Invalid data type ${dataType}`);
		}
		this.dataType = dataType;
	};
	ValueControl.prototype.getValue = function() {
		return this.dataSource ? this.fromSource(this.dataSource[this.dataField]) : this.value;
	};
	ValueControl.prototype.setValue = function(value) {
		if (this.isNumeric) {
			if (typeof value !== 'number') {
				value = this.parse(value);
				if (isNaN(value)) {
					value = this.defaultValue;
				}
			}
		} else {
			value = value !== undefined && value != null ? value : '';
		}
		var results = this.validate(value, true);
		if (results.length > 0) {
			results.forEach(x => {
				console.warn(x.message);
				value = x.value;
			});
		}
		this.dataLink ? this.dataLink.value = value : this.value = value;

		// update element
		if (this.element)
		{
			this.render({element:this.element.parentNode});
		}
		
		// if (this.element != null) {
		// 	if (this.element.value !== undefined) {
		// 		this.element.value = value;
		// 	} else {
		// 		this.element.innerHTML = value;
		// 	}
		// }
	};
	ValueControl.prototype.registerHandler = function(event) {
		if (['change'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
	};
	ValueControl.prototype.render = async function(ctx) {
		ValueControl.base.render.call(this, ctx);
		value = this.getValue();
		if (this.isNumeric) {
			this.element.setAttribute('min', this.min);
			this.element.setAttribute('max', this.max);
			this.element.setAttribute('step', this.step);
			if (this.decimalDigits > -1) {
				var pow = Math.pow(10, this.decimalDigits);
				value = Math.round(value*pow)/pow;
			}
			if (this.template.digits > 0) {
				value = (_digits + value).slice(-this.template.digits);
			}
		}
		var attribute = this.element.tagName == 'INPUT' ? 'value' : 'innerHTML';
		this.element[attribute] = value;
	};

	// ValueControl.prototype.onclick = function(e) {
	// 	if (this.dataType == Ui.Control.DataTypes.Bool) {
	// 		var value = this.dataSource[this.dataField];
	// 		this.dataSource[this.dataField] = value ? false : true;
	// 	}
	// };


	ValueControl.prototype.addValidation = function(field, check, message, fix) {
		if (this.validations[field] == undefined) this.validations[field] = [];
		this.validations[field].push(new ValueControl.Validation(message || `Validation error for '${field}'`, check, fix));
	}
	ValueControl.prototype.validate = function(value, isStrict) {
		var results = [];
		for (var field in this.validations) {
			for (var j=0; j<this.validations[field].length; j++) {
				var validation = this.validations[field][j];
				if (validation.check.call(this, value)) {
					if (validation.fix && isStrict) {
						value = validation.fix.call(this, value);
					}
					results.push({'field': `${this.id}#field`, 'value': value, 'message':validation.message});
				}
			}
		}
		return results;
	};
	ValueControl.Validation = function(message, check, fix) {	// bool check(field)
		this.check = check;
		this.message = message;
		this.fix = fix;
	};

	Ui.ValueControl = ValueControl;

})();