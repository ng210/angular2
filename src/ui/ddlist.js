include('/ui/valuecontrol.js');
(function() {

    Ui.DropDownList = function(id, template, parent) {
        Ui.ValueControl.call(this, id, template, parent);
        this.items = [];
		if (Array.isArray(template.items)) {
			this.setItems(template.items);
		}
        this.constructor = Ui.DropDownList;
    };
    Ui.DropDownList.base = Ui.ValueControl.prototype;
    Ui.DropDownList.prototype = new Ui.ValueControl('ddlist');
    Ui.Control.Types['ddlist'] = { ctor: Ui.DropDownList, tag: 'SELECT' };

    Ui.DropDownList.prototype.setValue = function(v) {
        var item = null;
        if (typeof v === 'number') {
            item = this.items[v] || null;
            v = item.value;
        } else {
            for (var i=0; i<this.items.length; i++) {
                if (v == this.items[i].value) {
                    item = this.items[i];
                    break;
                }
            }
        }
        if (item != null) {
            Ui.ValueControl.prototype.setValue.call(this, v);
        }
    };
    Ui.DropDownList.prototype.getSelectedItem = function() {
        var item = null;
        for (var i=0; i<this.items.length; i++) {
            if (this.value == this.items[i].key) {
                item = this.items[i];
                break;
            }
        }
        return { key: item.key, value: item.value, index:item.index };
    };
    Ui.DropDownList.prototype.addItem = function(keyValue) {
        var item = {};
        if (keyValue.key !== undefined) item.key = keyValue.key;
        if (keyValue.value !== undefined) item.value = keyValue.value;
        if (Array.isArray(keyValue)) {
            item.key = keyValue[0];
            item.value = keyValue[1];
        } else {
            item.key = item.value = keyValue;
        }
        item.index = this.items.length;
        this.items.push(item);
    };
    Ui.DropDownList.prototype.setItems = function(items) {
        if (Array.isArray(items)) {
            for (var i=0; i<items.length; i++)	{
                this.addItem(items[i]);
            }
        }
        this.setValue(0);
    };
    Ui.DropDownList.prototype.render = function(ctx) {
        Ui.DropDownList.base.render.call(this, ctx);
        while (this.element.options.length > 0) {
            this.element.remove(0);
        }
    	for (var i=0; i<this.items.length; i++)	{
            var keyValue = this.items[i];
            var option = document.createElement("option");
            option.text = keyValue.key;
            option.value = keyValue.value;
            this.element.add(option);
        }
        this.element.value = this.value;
    };

})();
