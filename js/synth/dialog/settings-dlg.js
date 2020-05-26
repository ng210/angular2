(function() {
    function SettingsDialog() {
        this.backup = {};
        Ui.Dialog.call(this, 'SettingsDialog', 
        {
            "titlebar": "Settings",
            "css": "dialog settings",
            "items": {
                "grid": {
                    "type":"grid", "titlebar":false, "header":false, "row-template": {
                        "name": { "type":"label", "data-field":"key", "data-type":"string" },
                        "value": { "type":"textbox", "data-field":"value", "events": ["change"] },
                        "help": { "type":"label", "data-field":"help" }
                    }
                }
            },
            "buttons": [Ui.Dialog.Buttons.Save, Ui.Dialog.Buttons.Cancel]
        });
    }
    extend(Ui.Dialog, SettingsDialog);

    SettingsDialog.prototype.open = function(app, data) {
        if (!this.items.grid.dataSource) {
            this.items.grid.dataBind(app.settings);
        }
        SettingsDialog.base.open.call(this, app, data);
    };

    SettingsDialog.prototype.onclick = function(e) {
        switch (e.control.value) {
            case 'Save':
                    this.close(1);
                    break;
            case 'Cancel':
                for (var key in this.backup) {
                    this.app.settings[key].value = this.backup[key];
                }
                this.close(0);
                break;
            default:
                break;
        }
    };

    SettingsDialog.prototype.render = function(ctx) {
        for (var key in this.app.settings) {
            this.backup[key] = this.app.settings[key].value;
        }
        SettingsDialog.base.render.call(this, ctx);
        this.items.grid.refresh();
    }

    // SettingsDialog.prototype.onchange = function(e) {
    //     console.log(`settings[${e.control.dataField}] = ${e.control.getValue()}`);
    // };

    public(SettingsDialog, 'Constructor');

})();
