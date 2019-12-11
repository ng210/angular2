(function() {
    var Ui = window.Ui || {};
	Ui.DataLink = function(obj) {
        Object.defineProperty(this, 'obj', { value: obj });
    }
    Ui.DataLink.prototype.add = function(control, field) {
        control.dataField = control.dataField || field;
        field = control.dataField;
        if (Object.keys(this.obj).indexOf(field) != -1) {
            Object.defineProperty(this, field, {
                enumerable:true,
                set: function(v) {
                    if (this.obj[field] !== v) {
                        //console.log(`set ${this.obj[field]} to ${v}`);
                        this.obj[field] = v;
                        control.setValue(v);
                    }
                },
                get: function() { return this.obj[field]; }
            });
            // add handler as the very first one
            if (control.handlers['change'] === undefined) {
                control.handlers['change'] = [];
            }
            control.handlers['change'].unshift( {
                obj:this,
                fn: function(control) {
                        var v = control.getValue();
                        if (this[control.dataField] !== v) {
                            //console.log(`change ${this[control.dataField]} to ${v}`);
                            this[control.dataField] = v;
                        }
                    }
            });
        }
    }
    public(Ui, 'Ui');
})();
