include('board.js');

(function() {
    var _supportedEvents = ['mousedown', 'mouseup', 'keydown', 'keyup', 'mouseover', 'mouseout', 'change'];

    function Select(id, tmpl, parent) {
        Ui.ValueControl.call(this, id, tmpl, parent);
        var template = {
            titlebar: this.template.titlebar
        };
        this.options = new Ui.Board(`${id}#options`, template, this);
        this.isFlag = this.template.flag;
        this.registerHandler('change');
    };
    extend(Ui.ValueControl, Select);

    Ui.Control.Types['select'] = { ctor: Select, tag: 'DIV' };

    Select.prototype.getTemplate = function() {
        var template = Select.base.getTemplate();
        template.titlebar = false;
        template.flag = false;
        template.type = 'select';
        template['data-type'] = Ui.Control.DataTypes.Int;
        template['item-type'] = 'label';
        return template;
    };
    Select.prototype.registerHandler = function(event) {
        if (_supportedEvents.indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
        Ui.Control.registerHandler.call(this, event);
    };

    Select.prototype.addOption = function(key, value) {
        var ctrl = value instanceof Ui.Control ? value : Ui.Control.create(`${this.id}_${key}`, { 'data-type': this.dataType, value:value, type:this.template['item-type'] });
        ctrl.css.push('option');
        this.options.add(key, ctrl);
        ctrl.parent = this;
        ctrl.registerHandler('click');
    };
    Select.prototype.add = undefined;

    Select.prototype.onclick = function(e) {
        var value = e.control.getValue();
        if (this.isFlag) {
            var oldValue = this.dataSource[this.dataField];
            var isSet = (oldValue & value) != 0;
            if (isSet) {
                value = oldValue & ~value;
                e.control.removeClass('on', true);
                //e.control.element.style.opacity = '0.4';
            } else {
                value = oldValue | value;
                //e.control.element.style.opacity = '0.1';
                e.control.addClass('on', true);
            }
        }
        this.setValue(value);
        //console.log(`${this.id}: ${this.value}`);
    };

    // Select.prototype.setValue = function(value) {
    //     this.value = value;
    //     this.element.dispatchEvent(new CustomEvent('change'));
    // };

    // Select.prototype.getValue = function() {
    //     return this.value;
    // };

	Select.prototype.render = async function(ctx) {
        Ui.Control.prototype.render.call(this, ctx);
        var value = this.getValue();
        for (var i in this.options.items) {
            var item = this.options.items[i];
            ((value & item.value) != 0) ? item.addClass('on') : item.removeClass('on');
            item.render({element:this.element});
        }        
		// var attribute = this.element.tagName == 'INPUT' ? 'value' : 'innerHTML';
		// this.element[attribute] = this.getValue();
	};

    Ui.Select = Select;
})();