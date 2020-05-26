(function() {

    function NewDialog() {
        Ui.Dialog.call(this, 'NewDialog', 
        {
            "titlebar": "New",
            "css": "dialog new",
            "layout": "free",
            "items": {
                "adapter": { "label": "Adapter", "type": "ddlist" , "item-value": "$key" }
            },
            "buttons": [Ui.Dialog.Buttons.Create, Ui.Dialog.Buttons.Cancel]
        });
        this.mode = null;
    }
    extend(Ui.Dialog, NewDialog);

    NewDialog.prototype.open = function(app, data) {
        this.items.adapter.setItems(app.adapters);
        this.mode = data;
        this.titleBarText = `Create new ${this.mode}`;
        NewDialog.base.open.call(this, app, data);
        this.changeAdapter(this.items.adapter.value);
    };

    NewDialog.prototype.onchange = function(e) {
        if (e.control == this.items.adapter) {
            this.changeAdapter(e.control.value);
        } else if (e.control == this.items.details.items.type) {
            console.log('Create a(n) ' + e.control.selectedItem);
        }
    };

    NewDialog.prototype.onclick = function(e) {
        if (e.control.value == 'Create') {
            // build init data for create device
            var details = this.items.details;
            result = details.getData();
            result.mode = this.mode;
            result.adapter = this.items.adapter.getValue();
            result.id = details.items.id ? details.items.id.getValue() : null;
            this.close(result);
        }
        if (e.control.value == 'Cancel') this.close();
    };

    NewDialog.prototype.changeAdapter = function(id) {
        var adapter = this.app.adapters[id];
        if (adapter) {
            if (this.items.details) {
                this.remove('details');
            }
            this.add('details', adapter.createDialog(this.mode));
            this.render();
        }
    };

    public(NewDialog, 'Constructor');

})();