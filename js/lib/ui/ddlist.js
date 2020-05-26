include('valuecontrol.js');
(function() {

    function DropDownList(id, template, parent) {
        Ui.ValueControl.call(this, id, template, parent);
        this.items = this.template.items;
        this.itemsChanged = true;
        this.itemKey = this.template['item-key'];
        this.itemValue = this.template['item-value'];
        this.selectedItem = null;
        this.value = -1;
    };
	extend(Ui.ValueControl, DropDownList);

    Ui.Control.Types['ddlist'] = { ctor: DropDownList, tag: 'SELECT' };

    DropDownList.prototype.getTemplate = function() {
        var template = DropDownList.base.getTemplate.call(this);
        template.type = 'ddlist';
        template.items = [];
        template['item-key'] = '$key';
        template['item-value'] = false;
        if (!template.events.includes('change')) template.events.push('change');
        return template;
    };

    DropDownList.prototype.dataBind = function(dataSource, dataField) {
        DropDownList.base.dataBind.call(this, dataSource, dataField);
        this.itemsChanged = true;
    };

    DropDownList.prototype.render = async function(ctx) {
        Ui.Control.prototype.render.call(this, ctx);
        if (this.itemsChanged || ctx.force) {
            // remove all options
            while (this.element.options.length > 0) {
                this.element.remove(0);
            }
            // add current options
            var ix = 0;
            for (var key in this.items)	{
                if (this.items.hasOwnProperty(key)) {
                    var item = this.items[key];
                    var option = document.createElement("option");
                    option.text = DropDownList.resolveReference(this.itemValue, item, key, ix);
                    option.value = DropDownList.resolveReference(this.itemKey, item, key, ix);
                    this.element.add(option);
                    ix++;
                }
            }
            this.itemsChanged = false;
        }
        var selected = this.find(this.getValue());
        if (selected != null) {
            this.element.selectedIndex = selected.index;
        }
    };

	DropDownList.prototype.registerHandler = function(event) {
		if (['change', 'click'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
	};

    DropDownList.prototype.onchange = function(e) {
        var selection = this.element.options[this.element.selectedIndex];
        this.selectedItem = this.items[selection.value];
        this.setValue(selection.value);
    };

    DropDownList.prototype.add = function(key, value) {
        this.items[key] = value;
        this.itemsChanged = true;
        if (this.element) {
            this.render();
        }
    };

    // DropDownList.prototype.setValue = function(value) {
    //     this.element.selectedIndex = this.findIndex(value);
    //     DropDownList.base.setValue.call(this, value);
    // };

    DropDownList.prototype.setItems = function(list) {
        this.items = {};
        for (var key in list) {
            if (list.hasOwnProperty(key)) {
                this.items[key] = list[key];
            }
        }
        this.itemsChanged = true;
        if (this.element) {
            this.render();
        }
    };

    DropDownList.prototype.select = function(value) {
        var result = this.find(value);
        if (result != null) {
            this.setValue(result.value);
            if (this.element) {
                this.element.selectedIndex = result.index;
                Ui.Control.onevent({type:'change', target:this.element});
            }        
        }
    };

    DropDownList.prototype.find = function(value) {
        var result = null;
        var ix = 0;
        for (var key in this.items) {
            if (this.items.hasOwnProperty(key)) {
                itemValue = DropDownList.resolveReference(this.itemValue, this.items[key], key, ix);
                if (value == itemValue) {
                    result = { key: key, value: this.items[key], index:ix };
                    break;
                }
                ix++;
            }
        }
        return result;
    };

    DropDownList.prototype.getSelected = function() {
        var ix = 0;
        var item = null;
        var key = null;
        for (key in this.items) {
            if (this.items.hasOwnProperty(key) && ix == this.element.selectedIndex) {
                item = this.items[key];
                break;
            }
        }
        return item ? {key: key, value: item, index: ix} : null;
    };

    // DropDownList.prototype.getValue = function() {
    // };

    DropDownList.resolveReference = function(ref, obj, key, index) {
        if (ref == '$key') return key;
        if (ref == '$Key') return key.charAt(0).toUpperCase() + key.substring(1);
        if (ref == '$index') return index;
        if (ref === false) return obj;
        return obj[ref];
    };

    Ui.DropDownList = DropDownList;
})();
